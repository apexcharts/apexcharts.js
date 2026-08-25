var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp.call(b2, prop))
      __defNormalProp(a, prop, b2[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b2)) {
      if (__propIsEnum.call(b2, prop))
        __defNormalProp(a, prop, b2[prop]);
    }
  return a;
};
var __spreadProps = (a, b2) => __defProps(a, __getOwnPropDescs(b2));
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v7.0.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Scatter = _core.__apex_charts_Scatter;
const Animations = _core.__apex_Animations;
const computeStagger = _core.__apex_Animations_computeStagger;
const applyAnimationPolicy = _core.__apex_Animations_applyAnimationPolicy;
const prefersReducedMotion = _core.__apex_Animations_prefersReducedMotion;
const applyProgressiveReveal = _core.__apex_Animations_applyProgressiveReveal;
const Base = _core.__apex_Base;
const register = _core.__apex_ChartFactory_register;
const getChartClass = _core.__apex_ChartFactory_getChartClass;
const isCustom = _core.__apex_ChartFactory_isCustom;
const Core = _core.__apex_Core;
const CoreUtils = _core.__apex_CoreUtils;
const Crosshairs = _core.__apex_Crosshairs;
const Data = _core.__apex_Data;
const DataLabels = _core.__apex_DataLabels;
const Events = _core.__apex_Events;
const Fill = _core.__apex_Fill;
const Filters = _core.__apex_Filters;
const Formatters = _core.__apex_Formatters;
const Graphics = _core.__apex_Graphics;
const Markers = _core.__apex_Markers;
const Range = _core.__apex_Range;
const Responsive = _core.__apex_Responsive;
const Scales = _core.__apex_Scales;
const Series = _core.__apex_Series;
const Theme = _core.__apex_Theme;
const TimeScale = _core.__apex_TimeScale;
const TitleSubtitle = _core.__apex_TitleSubtitle;
const Axes = _core.__apex_axes_Axes;
const AxesUtils = _core.__apex_axes_AxesUtils;
const Grid$1 = _core.__apex_axes_Grid;
const XAxis$1 = _core.__apex_axes_XAxis;
const YAxis$1 = _core.__apex_axes_YAxis;
const Dimensions = _core.__apex_dimensions_Dimensions;
const Grid = _core.__apex_dimensions_Grid;
const Helpers$4 = _core.__apex_dimensions_Helpers;
const XAxis = _core.__apex_dimensions_XAxis;
const YAxis = _core.__apex_dimensions_YAxis;
const Destroy = _core.__apex_helpers_Destroy;
const InitCtxVariables = _core.__apex_helpers_InitCtxVariables;
const Localization = _core.__apex_helpers_Localization;
const UpdateHelpers = _core.__apex_helpers_UpdateHelpers;
const Config = _core.__apex_Config;
const Defaults = _core.__apex_Defaults;
const Globals = _core.__apex_Globals;
const Options = _core.__apex_Options;
const AxesTooltip = _core.__apex_tooltip_AxesTooltip;
const Intersect = _core.__apex_tooltip_Intersect;
const Labels = _core.__apex_tooltip_Labels;
const Marker = _core.__apex_tooltip_Marker;
const Position = _core.__apex_tooltip_Position;
const Tooltip = _core.__apex_tooltip_Tooltip;
const Utils$1 = _core.__apex_tooltip_Utils;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const SSRDOMShim = _core.__apex_DOMShim_SSRDOMShim;
const SSRElement = _core.__apex_DOMShim_SSRElement;
const SSRClassList = _core.__apex_DOMShim_SSRClassList;
const parsePath = _core.__apex_PathMorphing_parsePath;
const morphPaths = _core.__apex_PathMorphing_morphPaths;
const pathBbox = _core.__apex_PathMorphing_pathBbox;
const arrayToPath = _core.__apex_PathMorphing_arrayToPath;
const SVGAnimationRunner = _core.__apex_SVGAnimation_SVGAnimationRunner;
const installAnimationMethods = _core.__apex_SVGAnimation_installAnimationMethods;
const SVGContainer = _core.__apex_SVGContainer;
const installDraggable = _core.__apex_SVGDraggable_installDraggable;
const SVGElement = _core.__apex_SVGElement;
const SVGFilter = _core.__apex_SVGFilter_SVGFilter;
const FilterBuilder = _core.__apex_SVGFilter_FilterBuilder;
const installFilterMethods = _core.__apex_SVGFilter_installFilterMethods;
const SVGGradient = _core.__apex_SVGGradient_SVGGradient;
const SVGPattern = _core.__apex_SVGPattern_SVGPattern;
const installSelectable = _core.__apex_SVGSelectable_installSelectable;
const SVG = _core.__apex_index_SVG;
const Box$1 = _core.__apex_index_Box;
const SVGNS$1 = _core.__apex_math_SVGNS;
const Point = _core.__apex_math_Point;
const Matrix = _core.__apex_math_Matrix;
const Box = _core.__apex_math_Box;
const LINE_HEIGHT_RATIO = _core.__apex_Constants_LINE_HEIGHT_RATIO;
const NICE_SCALE_ALLOWED_MAG_MSD = _core.__apex_Constants_NICE_SCALE_ALLOWED_MAG_MSD;
const NICE_SCALE_DEFAULT_TICKS = _core.__apex_Constants_NICE_SCALE_DEFAULT_TICKS;
const DateTime = _core.__apex_DateTime;
const Environment = _core.__apex_Environment_Environment;
const PerformanceCache = _core.__apex_PerformanceCache;
const addResizeListener = _core.__apex_Resize_addResizeListener;
const removeResizeListener = _core.__apex_Resize_removeResizeListener;
const getThemePalettes = _core.__apex_ThemePalettes_getThemePalettes;
const Utils = _core.__apex_Utils;
const coreInternals = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  __apex_Animations: Animations,
  __apex_Animations_applyAnimationPolicy: applyAnimationPolicy,
  __apex_Animations_applyProgressiveReveal: applyProgressiveReveal,
  __apex_Animations_computeStagger: computeStagger,
  __apex_Animations_prefersReducedMotion: prefersReducedMotion,
  __apex_Base: Base,
  __apex_BrowserAPIs_BrowserAPIs: BrowserAPIs,
  __apex_ChartFactory_getChartClass: getChartClass,
  __apex_ChartFactory_isCustom: isCustom,
  __apex_ChartFactory_register: register,
  __apex_Config: Config,
  __apex_Constants_LINE_HEIGHT_RATIO: LINE_HEIGHT_RATIO,
  __apex_Constants_NICE_SCALE_ALLOWED_MAG_MSD: NICE_SCALE_ALLOWED_MAG_MSD,
  __apex_Constants_NICE_SCALE_DEFAULT_TICKS: NICE_SCALE_DEFAULT_TICKS,
  __apex_Core: Core,
  __apex_CoreUtils: CoreUtils,
  __apex_Crosshairs: Crosshairs,
  __apex_DOMShim_SSRClassList: SSRClassList,
  __apex_DOMShim_SSRDOMShim: SSRDOMShim,
  __apex_DOMShim_SSRElement: SSRElement,
  __apex_Data: Data,
  __apex_DataLabels: DataLabels,
  __apex_DateTime: DateTime,
  __apex_Defaults: Defaults,
  __apex_Environment_Environment: Environment,
  __apex_Events: Events,
  __apex_Fill: Fill,
  __apex_Filters: Filters,
  __apex_Formatters: Formatters,
  __apex_Globals: Globals,
  __apex_Graphics: Graphics,
  __apex_Markers: Markers,
  __apex_Options: Options,
  __apex_PathMorphing_arrayToPath: arrayToPath,
  __apex_PathMorphing_morphPaths: morphPaths,
  __apex_PathMorphing_parsePath: parsePath,
  __apex_PathMorphing_pathBbox: pathBbox,
  __apex_PerformanceCache: PerformanceCache,
  __apex_Range: Range,
  __apex_Resize_addResizeListener: addResizeListener,
  __apex_Resize_removeResizeListener: removeResizeListener,
  __apex_Responsive: Responsive,
  __apex_SVGAnimation_SVGAnimationRunner: SVGAnimationRunner,
  __apex_SVGAnimation_installAnimationMethods: installAnimationMethods,
  __apex_SVGContainer: SVGContainer,
  __apex_SVGDraggable_installDraggable: installDraggable,
  __apex_SVGElement: SVGElement,
  __apex_SVGFilter_FilterBuilder: FilterBuilder,
  __apex_SVGFilter_SVGFilter: SVGFilter,
  __apex_SVGFilter_installFilterMethods: installFilterMethods,
  __apex_SVGGradient_SVGGradient: SVGGradient,
  __apex_SVGPattern_SVGPattern: SVGPattern,
  __apex_SVGSelectable_installSelectable: installSelectable,
  __apex_Scales: Scales,
  __apex_Series: Series,
  __apex_Theme: Theme,
  __apex_ThemePalettes_getThemePalettes: getThemePalettes,
  __apex_TimeScale: TimeScale,
  __apex_TitleSubtitle: TitleSubtitle,
  __apex_Utils: Utils,
  __apex_axes_Axes: Axes,
  __apex_axes_AxesUtils: AxesUtils,
  __apex_axes_Grid: Grid$1,
  __apex_axes_XAxis: XAxis$1,
  __apex_axes_YAxis: YAxis$1,
  __apex_charts_Scatter: Scatter,
  __apex_dimensions_Dimensions: Dimensions,
  __apex_dimensions_Grid: Grid,
  __apex_dimensions_Helpers: Helpers$4,
  __apex_dimensions_XAxis: XAxis,
  __apex_dimensions_YAxis: YAxis,
  __apex_helpers_Destroy: Destroy,
  __apex_helpers_InitCtxVariables: InitCtxVariables,
  __apex_helpers_Localization: Localization,
  __apex_helpers_UpdateHelpers: UpdateHelpers,
  __apex_index_Box: Box$1,
  __apex_index_SVG: SVG,
  __apex_math_Box: Box,
  __apex_math_Matrix: Matrix,
  __apex_math_Point: Point,
  __apex_math_SVGNS: SVGNS$1,
  __apex_tooltip_AxesTooltip: AxesTooltip,
  __apex_tooltip_Intersect: Intersect,
  __apex_tooltip_Labels: Labels,
  __apex_tooltip_Marker: Marker,
  __apex_tooltip_Position: Position,
  __apex_tooltip_Tooltip: Tooltip,
  __apex_tooltip_Utils: Utils$1,
  default: _core__default
}, Symbol.toStringTag, { value: "Module" }));
class Exports {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
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
   * Inline any Strata canvas series layer into the clone as an SVG `<image>`.
   * A serialized `<canvas>` loses its bitmap, so a canvas-mode export would drop
   * the series; an `<image>` carrying the canvas `toDataURL()` preserves it in
   * place. Because it replaces the `<foreignObject>` at the same DOM position,
   * the grid-behind / annotations-in-front z-order is retained automatically.
   * No-op in SVG mode (no series canvas present).
   * @param {any} clonedNode the cloned elWrap about to be serialized
   */
  inlineCanvasLayers(clonedNode) {
    const w2 = this.w;
    const XLINK = "http://www.w3.org/1999/xlink";
    const origCanvases = w2.dom.elWrap.querySelectorAll(
      ".apexcharts-series-canvas"
    );
    if (!origCanvases.length) return;
    const clonedFOs = clonedNode.querySelectorAll(".apexcharts-canvas-series");
    for (let i = 0; i < origCanvases.length && i < clonedFOs.length; i++) {
      let dataURL;
      try {
        dataURL = /** @type {HTMLCanvasElement} */
        origCanvases[i].toDataURL();
      } catch (e) {
        continue;
      }
      const fo = clonedFOs[i];
      const img = document.createElementNS(SVGNS$1, "image");
      img.setAttribute("x", fo.getAttribute("x") || "0");
      img.setAttribute("y", fo.getAttribute("y") || "0");
      img.setAttribute("width", fo.getAttribute("width") || "0");
      img.setAttribute("height", fo.getAttribute("height") || "0");
      img.setAttribute("href", dataURL);
      img.setAttributeNS(XLINK, "xlink:href", dataURL);
      if (fo.parentNode) fo.parentNode.replaceChild(img, fo);
    }
  }
  /**
   * `querySelectorAll` as a typed array. Both HTML and SVG elements carry
   * `style` / `classList`, but `NodeListOf<Element>` does not.
   * @param {ParentNode} root
   * @param {string} selector
   * @returns {Array<HTMLElement | SVGElement>}
   */
  queryStyleable(root, selector) {
    return (
      /** @type {Array<HTMLElement | SVGElement>} */
      Array.prototype.slice.call(root.querySelectorAll(selector))
    );
  }
  /**
   * Applies `styles` only where the element has no inline value for that
   * property yet.
   *
   * The rules being re-applied here came from a stylesheet, so anything a
   * module set inline has to keep winning exactly like it does in the live
   * DOM: `legend.fontSize` (Legend.js) and the heatmap gradient legend's
   * deliberate `display`/`overflow`/`padding` overrides on the legend wrap
   * (HeatmapGradientLegend.js) would otherwise be clobbered in the export.
   * @param {HTMLElement | SVGElement} el
   * @param {Record<string, string>} styles
   */
  setStyleDefaults(el, styles) {
    Object.keys(styles).forEach((prop) => {
      if (el.style.getPropertyValue(prop) === "") {
        el.style.setProperty(prop, styles[prop]);
      }
    });
  }
  /**
   * Re-applies, as inline styles on the clone, the rules that used to reach
   * the exported SVG through an injected `<style>` block. A strict
   * Content-Security-Policy without `'unsafe-inline'` blocks that block and
   * breaks the export, so the export must not depend on one. See #5146.
   *
   * Mirrors `src/assets/apexcharts-legend.css`. Interaction-only rules
   * (`cursor`, `pointer-events`) are carried over for parity even though they
   * do nothing in a static image; the layout rules are what matter.
   * @param {HTMLElement} clonedNode the cloned elWrap about to be serialized
   */
  applyExportStyles(clonedNode) {
    const w2 = this.w;
    this.queryStyleable(clonedNode, "style").forEach((el) => el.remove());
    this.queryStyleable(
      clonedNode,
      [
        ".apexcharts-tooltip",
        ".apexcharts-toolbar",
        ".apexcharts-xaxistooltip",
        ".apexcharts-yaxistooltip",
        ".apexcharts-xcrosshairs",
        ".apexcharts-ycrosshairs",
        ".apexcharts-zoom-rect",
        ".apexcharts-selection-rect"
      ].join(", ")
    ).forEach((el) => {
      el.style.setProperty("display", "none", "important");
    });
    this.queryStyleable(clonedNode, ".apexcharts-flip-y").forEach((el) => {
      this.setStyleDefaults(el, {
        transform: "scaleY(-1) translateY(-100%)",
        "transform-origin": "top",
        "transform-box": "fill-box"
      });
    });
    this.queryStyleable(clonedNode, ".apexcharts-flip-x").forEach((el) => {
      this.setStyleDefaults(el, {
        transform: "scaleX(-1)",
        "transform-origin": "center",
        "transform-box": "fill-box"
      });
    });
    if (!w2.config.legend.show || !w2.dom.elLegendWrap || !w2.dom.elLegendWrap.children.length) {
      return;
    }
    this.queryStyleable(clonedNode, ".apexcharts-legend").forEach((el) => {
      this.setStyleDefaults(el, {
        display: "flex",
        overflow: "auto",
        padding: "0 10px"
      });
      const cl = el.classList;
      const isSide = cl.contains("apx-legend-position-left") || cl.contains("apx-legend-position-right");
      const isTopOrBottom = cl.contains("apx-legend-position-top") || cl.contains("apx-legend-position-bottom");
      if (cl.contains("apexcharts-legend-group-horizontal")) {
        this.setStyleDefaults(el, { "flex-direction": "column" });
      }
      if (isSide) {
        this.setStyleDefaults(el, { "flex-direction": "column", bottom: "0" });
      }
      if (isTopOrBottom) {
        this.setStyleDefaults(el, { "flex-wrap": "wrap" });
      }
      if (isSide || isTopOrBottom && cl.contains("apexcharts-align-left")) {
        this.setStyleDefaults(el, {
          "justify-content": "flex-start",
          "align-items": "flex-start"
        });
      } else if (isTopOrBottom && cl.contains("apexcharts-align-center")) {
        this.setStyleDefaults(el, {
          "justify-content": "center",
          "align-items": "center"
        });
      } else if (isTopOrBottom && cl.contains("apexcharts-align-right")) {
        this.setStyleDefaults(el, {
          "justify-content": "flex-end",
          "align-items": "flex-end"
        });
      }
    });
    this.queryStyleable(clonedNode, ".apexcharts-legend-group").forEach(
      (el) => {
        this.setStyleDefaults(el, { display: "flex" });
      }
    );
    this.queryStyleable(
      clonedNode,
      ".apexcharts-legend-group-vertical"
    ).forEach((el) => {
      this.setStyleDefaults(el, { "flex-direction": "column-reverse" });
    });
    this.queryStyleable(clonedNode, ".apexcharts-legend-series").forEach(
      (el) => {
        this.setStyleDefaults(el, {
          cursor: el.classList.contains("apexcharts-no-click") ? "auto" : "pointer",
          "line-height": "normal",
          display: "flex",
          "align-items": "center"
        });
      }
    );
    this.queryStyleable(clonedNode, ".apexcharts-legend-text").forEach((el) => {
      this.setStyleDefaults(el, {
        position: "relative",
        "font-size": "14px"
      });
    });
    this.queryStyleable(clonedNode, ".apexcharts-legend-marker").forEach(
      (el) => {
        this.setStyleDefaults(el, {
          position: "relative",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          cursor: "pointer",
          "margin-right": "1px"
        });
      }
    );
    this.queryStyleable(clonedNode, ".apexcharts-inactive-legend").forEach(
      (el) => {
        this.setStyleDefaults(el, { opacity: "0.45" });
      }
    );
    this.queryStyleable(
      clonedNode,
      ".apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series"
    ).forEach((el) => {
      el.style.setProperty("display", "none", "important");
    });
  }
  /**
   * The colour a raster export paints under the chart.
   *
   * A PNG needs an opaque base, so `dataURI` fills the canvas before drawing
   * the SVG onto it. That fill used to be `#fff` whenever `chart.background`
   * was unset *or* `'transparent'`, which is wrong for a dark theme:
   * `theme.mode: 'dark'` moves `chart.foreColor` to a near-white `#f6f7f8` but
   * leaves the background alone, so `background: 'transparent'` produced
   * near-white labels, axes and legend on white — a PNG that looked like it had
   * lost all its text. See #2920.
   *
   * The unset-background case was already covered: `Core.setupElements` paints
   * the SVG paper `#343A3F` for a dark theme, and the clone carries that inline
   * style into the export. `'transparent'` is the gap, because it makes that
   * paper style transparent too and nothing is left to cover the white fill.
   *
   * An explicit non-transparent `chart.background` still wins, including one
   * written by the Facet `--apx-surface` token (Theme assigns it into the same
   * field).
   * @returns {string}
   */
  resolveExportBackground() {
    const w2 = this.w;
    const bg = w2.config.chart.background;
    if (bg && bg !== "transparent") return bg;
    return w2.config.theme.mode === "dark" ? "#343A3F" : "#fff";
  }
  /**
   * Font families the rendered chart actually paints with.
   *
   * Read off the live DOM rather than the config: computed styles resolve
   * `chart.fontFamily`, every per-element `style.fontFamily` override, and any
   * family the chart inherits from the page, none of which are reliably
   * enumerable from config alone. The clone is not in the document, so its
   * computed styles would come back empty.
   * @returns {Set<string>}
   */
  collectFontFamilies() {
    const families = /* @__PURE__ */ new Set();
    const w2 = this.w;
    if (!Environment.isBrowser() || !w2.dom.elWrap) return families;
    const els = this.queryStyleable(
      w2.dom.elWrap,
      "text, tspan, .apexcharts-legend-text, .apexcharts-title-text, .apexcharts-subtitle-text"
    );
    const all = [w2.dom.elWrap, ...els];
    all.forEach((el) => {
      const cs = (
        /** @type {any} */
        BrowserAPIs.getComputedStyle(
          /** @type {any} */
          el
        )
      );
      const ff = cs && cs.fontFamily;
      if (!ff) return;
      ff.split(",").forEach((name) => {
        const clean = name.trim().replace(/^['"]|['"]$/g, "");
        if (clean) families.add(clean.toLowerCase());
      });
    });
    return families;
  }
  /**
   * Every `@font-face` rule reachable from the document, as `{ family, css }`.
   *
   * Same-origin sheets are read through `cssRules`. A cross-origin sheet throws
   * on that access, so it is re-fetched by href and its `@font-face` blocks are
   * pulled out of the text: that is the path that matters in practice, since
   * hosted webfonts (the subject of #3617) are exactly the cross-origin case.
   * @returns {Promise<Array<{family: string, css: string}>>}
   */
  collectFontFaceRules() {
    if (!Environment.isBrowser()) return Promise.resolve([]);
    const found = [];
    const remote = [];
    const pushFromText = (cssText) => {
      const blocks = cssText.match(/@font-face\s*\{[^}]*\}/gi) || [];
      blocks.forEach((css) => {
        const m2 = css.match(/font-family\s*:\s*([^;}]+)/i);
        if (!m2) return;
        const family = m2[1].trim().replace(/^['"]|['"]$/g, "");
        found.push({ family: family.toLowerCase(), css });
      });
    };
    const sheets = Array.from(document.styleSheets || []);
    sheets.forEach((sheet) => {
      let rules = null;
      try {
        rules = sheet.cssRules;
      } catch (e) {
        rules = null;
      }
      if (rules) {
        Array.from(rules).forEach((rule) => {
          if (rule.type === 5 && rule.cssText) pushFromText(rule.cssText);
        });
        return;
      }
      if (sheet.href) {
        remote.push(
          fetch(sheet.href).then((r) => r.ok ? r.text() : "").then(pushFromText).catch(() => {
          })
        );
      }
    });
    return Promise.all(remote).then(() => found);
  }
  /**
   * Inline the `@font-face` rules for the families the chart uses, with the
   * font files themselves as base64 data URIs, into the exported SVG.
   *
   * Needed because the export is a standalone document: rasterizing it through
   * `<img src="data:image/svg+xml,...">` gives it no access to the page's
   * stylesheets *or* its loaded fonts, and an SVG-as-image may not fetch
   * external resources at all. Without this the text silently reflows into a
   * generic fallback face. See #3617.
   *
   * `@font-face` only exists as a stylesheet construct, so unlike the rules in
   * `applyExportStyles` this cannot be expressed as inline styles and has to
   * ship as a `<style>` element. A page whose CSP forbids inline styles will
   * drop it and fall back to today's behaviour, which is why the whole thing is
   * best-effort: any failure leaves the export exactly as it was.
   * @param {any} svgNode the parsed outer <svg> about to be serialized
   * @returns {Promise<void>}
   */
  embedFonts(svgNode) {
    const w2 = this.w;
    if (!Environment.isBrowser() || !w2.config.chart.toolbar.export.embedFonts || typeof fetch !== "function") {
      return Promise.resolve();
    }
    const used = this.collectFontFamilies();
    if (!used.size) return Promise.resolve();
    return this.collectFontFaceRules().then((faces) => {
      const wanted = faces.filter((f) => used.has(f.family));
      if (!wanted.length) return Promise.resolve([]);
      return Promise.all(
        wanted.map(
          (face) => this.inlineFontFaceUrls(face.css).catch(() => null)
        )
      );
    }).then((cssBlocks) => {
      const css = (cssBlocks || []).filter(Boolean).join("\n");
      if (!css) return;
      const style = document.createElementNS(SVGNS$1, "style");
      style.textContent = css;
      svgNode.insertBefore(style, svgNode.firstChild);
    }).catch(() => {
    });
  }
  /**
   * Replace every remote `url(...)` in one `@font-face` block with a base64
   * data URI. Resolves to null if no url could be fetched, so the caller can
   * drop a block that would only reference unreachable files.
   * @param {string} css
   * @returns {Promise<string | null>}
   */
  inlineFontFaceUrls(css) {
    const urls = [];
    const re = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
    let m2;
    while ((m2 = re.exec(css)) !== null) {
      if (!m2[2].startsWith("data:")) urls.push(m2[2]);
    }
    if (!urls.length) return Promise.resolve(css.includes("data:") ? css : null);
    return Promise.all(
      urls.map(
        (url) => this.fetchAsDataUri(url).then((dataUri) => ({ url, dataUri })).catch(() => ({ url, dataUri: null }))
      )
    ).then((results) => {
      let out = css;
      let replaced = 0;
      results.forEach(({ url, dataUri }) => {
        if (!dataUri) return;
        out = out.split(url).join(dataUri);
        replaced++;
      });
      return replaced ? out : null;
    });
  }
  /**
   * Fetch a binary asset as a base64 data URI.
   *
   * Uses `fetch` rather than the `<img>`+canvas route in `getBase64FromUrl`:
   * that route only works for raster images and taints the canvas for any
   * response without CORS headers, whereas this works for fonts too and fails
   * cleanly when CORS denies it.
   * @param {string} url
   * @returns {Promise<string>}
   */
  fetchAsDataUri(url) {
    if (typeof fetch !== "function" || typeof btoa !== "function") {
      return Promise.reject(new Error("fetch unavailable"));
    }
    return fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const type = res.headers.get("content-type") || "application/octet-stream";
      return res.arrayBuffer().then((buf) => {
        const bytes = new Uint8Array(buf);
        let binary = "";
        const CHUNK = 32768;
        for (let i = 0; i < bytes.length; i += CHUNK) {
          binary += String.fromCharCode.apply(
            null,
            /** @type {any} */
            bytes.subarray(i, i + CHUNK)
          );
        }
        return `data:${type};base64,${btoa(binary)}`;
      });
    });
  }
  /**
   * @param {number} [_scale]
   */
  getSvgString(_scale) {
    return new Promise((resolve) => {
      const w2 = this.w;
      let scale = _scale || w2.config.chart.toolbar.export.scale || w2.config.chart.toolbar.export.width / w2.globals.svgWidth;
      if (!scale) {
        scale = 1;
      }
      const width = w2.globals.svgWidth * scale;
      const height = w2.globals.svgHeight * scale;
      const clonedNode = (
        /** @type {HTMLElement} */
        w2.dom.elWrap.cloneNode(true)
      );
      clonedNode.style.width = width + "px";
      clonedNode.style.height = height + "px";
      this.inlineCanvasLayers(clonedNode);
      this.applyExportStyles(clonedNode);
      const serializedNode = new XMLSerializer().serializeToString(clonedNode);
      let svgString = `
        <svg xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          class="apexcharts-svg"
          xmlns:data="ApexChartsNS"
          transform="translate(0, 0)"
          width="${w2.globals.svgWidth}px" height="${w2.globals.svgHeight}px">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px; height:${height}px;">
              ${serializedNode}
            </div>
          </foreignObject>
        </svg>
      `;
      const svgNode = this.svgStringToNode(svgString);
      if (scale !== 1) {
        this.scaleSvgNode(svgNode, scale);
      }
      Promise.all([
        this.convertImagesToBase64(svgNode),
        this.embedFonts(svgNode)
      ]).then(() => {
        svgString = new XMLSerializer().serializeToString(svgNode);
        resolve(svgString.replace(/&nbsp;/g, "&#160;"));
      });
    });
  }
  /**
   * Turn every remote `<image>` in the export into an inline data URI.
   *
   * This is not an optimisation: an SVG rasterized through `<img src="data:...">`
   * is not allowed to fetch external resources, so any href left pointing at a
   * URL vanishes from the PNG entirely. Image annotations and `hollow.image`
   * were disappearing from downloads for exactly this reason. See #3170.
   *
   * Two things were missing before. `SVGContainer.image()` writes `xlink:href`,
   * but Strata's inlined canvas layers and hand-authored `customSVG` markup use
   * the plain `href` form, and only the namespaced attribute was being read.
   * And conversion went through `<img>`+canvas, which taints (and therefore
   * throws) for any response without CORS headers, so a cross-origin icon,
   * the common case, silently failed. `fetch` is tried first and only falls
   * back to the canvas route, which still helps for a same-origin image on a
   * page whose CSP blocks `connect-src`.
   * @param {any} svgNode
   */
  convertImagesToBase64(svgNode) {
    const XLINK = "http://www.w3.org/1999/xlink";
    const images = svgNode.getElementsByTagName("image");
    const promises = Array.from(images).map((img) => {
      const nsHref = img.getAttributeNS(XLINK, "href");
      const plainHref = img.getAttribute("href");
      const href = nsHref || plainHref;
      if (!href || href.startsWith("data:")) return Promise.resolve();
      const write = (base64) => {
        if (nsHref) img.setAttributeNS(XLINK, "href", base64);
        if (plainHref || !nsHref) img.setAttribute("href", base64);
      };
      return this.fetchAsDataUri(href).then(write).catch(
        () => this.getBase64FromUrl(href).then(write).catch((error) => {
          console.error("Error converting image to base64:", error);
        })
      );
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
      const w2 = this.w;
      const scale = options ? options.scale || options.width / w2.globals.svgWidth : 1;
      const canvas = document.createElement("canvas");
      canvas.width = w2.globals.svgWidth * scale;
      canvas.height = parseInt(w2.dom.elWrap.style.height, 10) * scale;
      const canvasBg = this.resolveExportBackground();
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    const w2 = this.w;
    if (!series) series = w2.config.series;
    let columns = [];
    const rows = [];
    let result = "";
    const universalBOM = "\uFEFF";
    const gSeries = w2.seriesData.series.map((s, i) => {
      return w2.globals.collapsedSeriesIndices.indexOf(i) === -1 ? s : [];
    });
    const csvSafe = (val) => {
      if (val == null || Utils.isNumber(val)) return val;
      const s = String(val);
      return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    };
    const getFormattedCategory = (cat) => {
      if (typeof w2.config.chart.toolbar.export.csv.categoryFormatter === "function") {
        return w2.config.chart.toolbar.export.csv.categoryFormatter(cat);
      }
      if (w2.config.xaxis.type === "datetime" && String(cat).length >= 10) {
        return new Date(cat).toDateString();
      }
      return Utils.isNumber(cat) ? cat : csvSafe(cat.split(columnDelimiter).join(""));
    };
    const getFormattedValue = (value) => {
      return typeof w2.config.chart.toolbar.export.csv.valueFormatter === "function" ? w2.config.chart.toolbar.export.csv.valueFormatter(value) : csvSafe(value);
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
      if (!w2.globals.axisCharts) {
        cat = w2.config.labels[i];
      } else {
        if (w2.config.xaxis.type === "category" || w2.config.xaxis.convertedCatToNumeric) {
          if (w2.globals.isBarHorizontal) {
            const lbFormatter = w2.formatters.yLabelFormatters[0];
            const sr = new Series(this.ctx.w);
            const activeSeries = sr.getActiveConfigSeriesIndex();
            cat = lbFormatter(w2.labelData.labels[i], {
              seriesIndex: activeSeries,
              dataPointIndex: i,
              w: w2
            });
          } else {
            cat = axesUtils.getLabel(
              w2.labelData.labels,
              w2.labelData.timescaleLabels,
              0,
              i
            ).text;
          }
        }
        if (w2.config.xaxis.type === "datetime") {
          if (w2.config.xaxis.categories.length) {
            cat = w2.config.xaxis.categories[i];
          } else if (w2.config.labels.length) {
            cat = w2.config.labels[i];
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
      var _a, _b, _c, _d, _e, _f;
      if (columns.length && sI === 0) {
        rows.push(columns.join(columnDelimiter));
      }
      if (s.data) {
        const rowData = s.data.length ? s.data : getEmptyDataForCsvColumn();
        for (let i = 0; i < rowData.length; i++) {
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
            for (let ci = 0; ci < w2.seriesData.series.length; ci++) {
              const value = dataFormat.isFormatXY() ? (_a = series[ci].data[i]) == null ? void 0 : _a.y : gSeries[ci][i];
              columns.push(getFormattedValue(value));
            }
          }
          if (w2.config.chart.type === "candlestick" || s.type && s.type === "candlestick") {
            columns.pop();
            columns.push(w2.candleData.seriesCandleO[sI][i]);
            columns.push(w2.candleData.seriesCandleH[sI][i]);
            columns.push(w2.candleData.seriesCandleL[sI][i]);
            columns.push(w2.candleData.seriesCandleC[sI][i]);
          }
          if (w2.config.chart.type === "boxPlot" || s.type && s.type === "boxPlot") {
            columns.pop();
            columns.push(w2.candleData.seriesCandleO[sI][i]);
            columns.push(w2.candleData.seriesCandleH[sI][i]);
            columns.push(w2.candleData.seriesCandleM[sI][i]);
            columns.push(w2.candleData.seriesCandleL[sI][i]);
            columns.push(w2.candleData.seriesCandleC[sI][i]);
          }
          if (w2.config.chart.type === "rangeBar") {
            columns.pop();
            columns.push(w2.rangeData.seriesRangeStart[sI][i]);
            columns.push(w2.rangeData.seriesRangeEnd[sI][i]);
          }
          if (w2.config.chart.type === "violin" || s.type && s.type === "violin") {
            columns.pop();
            columns.push((_b = w2.violinData.seriesViolinMin[sI]) == null ? void 0 : _b[i]);
            columns.push((_c = w2.violinData.seriesViolinMax[sI]) == null ? void 0 : _c[i]);
            columns.push((_f = (_e = (_d = w2.violinData.seriesViolinPoints[sI]) == null ? void 0 : _d[i]) == null ? void 0 : _e.length) != null ? _f : 0);
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
        const values = (
          /** @type {Record<string,any>} */
          data[cat]
        );
        rows.push([getFormattedCategory(cat), ...values].join(columnDelimiter));
      });
    };
    columns.push(w2.config.chart.toolbar.export.csv.headerCategory);
    if (w2.config.chart.type === "boxPlot") {
      columns.push("minimum");
      columns.push("q1");
      columns.push("median");
      columns.push("q3");
      columns.push("maximum");
    } else if (w2.config.chart.type === "candlestick") {
      columns.push("open");
      columns.push("high");
      columns.push("low");
      columns.push("close");
    } else if (w2.config.chart.type === "rangeBar") {
      columns.push("minimum");
      columns.push("maximum");
    } else if (w2.config.chart.type === "violin") {
      columns.push("minimum");
      columns.push("maximum");
      columns.push("observations");
    } else {
      series.map((s, sI) => {
        const sname = (s.name ? s.name : `series-${sI}`) + "";
        if (w2.globals.axisCharts) {
          columns.push(
            sname.split(columnDelimiter).join("") ? sname.split(columnDelimiter).join("") : `series-${sI}`
          );
        }
      });
    }
    if (!w2.globals.axisCharts) {
      columns.push(w2.config.chart.toolbar.export.csv.headerValue);
      rows.push(columns.join(columnDelimiter));
    }
    if (!w2.globals.allSeriesHasEqualX && w2.globals.axisCharts && !w2.config.xaxis.categories.length && !w2.config.labels.length) {
      handleUnequalXValues();
    } else {
      series.map((s, sI) => {
        if (w2.globals.axisCharts) {
          handleAxisRowsColumns(s, sI);
        } else {
          columns = [];
          columns.push(getFormattedCategory(w2.labelData.labels[sI]));
          columns.push(getFormattedValue(gSeries[sI]));
          rows.push(columns.join(columnDelimiter));
        }
      });
    }
    result += rows.join(lineDelimiter);
    this.triggerDownload(
      "data:text/csv; charset=utf-8," + encodeURIComponent(universalBOM + result),
      fileName ? fileName : w2.config.chart.toolbar.export.csv.filename,
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
_core__default.registerFeatures({ exports: Exports });
const apexchartsLegendCSS = ".apexcharts-flip-y {\n  transform: scaleY(-1) translateY(-100%);\n  transform-origin: top;\n  transform-box: fill-box;\n}\n.apexcharts-flip-x {\n  transform: scaleX(-1);\n  transform-origin: center;\n  transform-box: fill-box;\n}\n.apexcharts-legend {\n  display: flex;\n  overflow: auto;\n  padding: 0 10px;\n}\n.apexcharts-legend.apexcharts-legend-group-horizontal {\n  flex-direction: column;\n}\n.apexcharts-legend-group {\n  display: flex;\n}\n.apexcharts-legend-group-vertical {\n  flex-direction: column-reverse;\n}\n.apexcharts-legend.apx-legend-position-bottom, .apexcharts-legend.apx-legend-position-top {\n  flex-wrap: wrap\n}\n.apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  flex-direction: column;\n  bottom: 0;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-left, .apexcharts-legend.apx-legend-position-top.apexcharts-align-left, .apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  justify-content: flex-start;\n  align-items: flex-start;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-center, .apexcharts-legend.apx-legend-position-top.apexcharts-align-center {\n  justify-content: center;\n  align-items: center;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-right, .apexcharts-legend.apx-legend-position-top.apexcharts-align-right {\n  justify-content: flex-end;\n  align-items: flex-end;\n}\n.apexcharts-legend-series {\n  cursor: pointer;\n  line-height: normal;\n  display: flex;\n  align-items: center;\n}\n.apexcharts-legend-text {\n  position: relative;\n  font-size: 14px;\n}\n.apexcharts-legend-text *, .apexcharts-legend-marker * {\n  pointer-events: none;\n}\n.apexcharts-legend-marker {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  margin-right: 1px;\n}\n\n.apexcharts-legend-series.apexcharts-no-click {\n  cursor: auto;\n}\n.apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series {\n  display: none !important;\n}\n.apexcharts-inactive-legend {\n  opacity: 0.45;\n} ";
let Helpers$3 = class Helpers {
  /**
   * @param {import('./Legend').default} lgCtx
   */
  constructor(lgCtx) {
    this.w = lgCtx.w;
    this.lgCtx = lgCtx;
  }
  getLegendStyles() {
    if (Environment.isSSR()) return null;
    const stylesheet = document.createElement("style");
    stylesheet.setAttribute("type", "text/css");
    const nonce = this.w.config.chart.nonce;
    if (nonce) {
      stylesheet.setAttribute("nonce", nonce);
    }
    const rule = document.createTextNode(apexchartsLegendCSS);
    stylesheet.appendChild(rule);
    return stylesheet;
  }
  getLegendDimensions() {
    const w2 = this.w;
    const currLegendsWrap = w2.dom.baseEl.querySelector(".apexcharts-legend");
    if (!currLegendsWrap) {
      return { clwh: 0, clww: 0 };
    }
    const { width: currLegendsWrapWidth, height: currLegendsWrapHeight } = currLegendsWrap.getBoundingClientRect();
    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth
    };
  }
  appendToForeignObject() {
    var _a;
    const legendStyles = this.getLegendStyles();
    if (this.w.config.chart.injectStyleSheet !== false && legendStyles) {
      (_a = this.w.dom.elLegendForeign) == null ? void 0 : _a.appendChild(legendStyles);
    }
  }
  /**
   * @param {number} seriesCnt
   * @param {boolean} isHidden
   */
  toggleDataSeries(seriesCnt, isHidden) {
    var _a, _b, _c;
    const w2 = this.w;
    if (w2.globals.axisCharts || w2.config.chart.type === "radialBar") {
      w2.globals.resized = true;
      let seriesEl = null;
      let realIndex = null;
      w2.globals.risingSeries = [];
      if (w2.globals.axisCharts) {
        seriesEl = (_a = Array.prototype.find.call(
          w2.dom.baseEl.querySelectorAll(".apexcharts-series"),
          (el) => el.getAttribute("data:realIndex") === String(seriesCnt)
        )) != null ? _a : null;
        if (!seriesEl) return;
        realIndex = parseInt((_b = seriesEl.getAttribute("data:realIndex")) != null ? _b : "", 10);
      } else {
        seriesEl = w2.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        );
        if (!seriesEl) return;
        realIndex = parseInt((_c = seriesEl.getAttribute("rel")) != null ? _c : "", 10) - 1;
      }
      if (isHidden) {
        const seriesToMakeVisible = [
          {
            cs: w2.globals.collapsedSeries,
            csi: w2.globals.collapsedSeriesIndices
          },
          {
            cs: w2.globals.ancillaryCollapsedSeries,
            csi: w2.globals.ancillaryCollapsedSeriesIndices
          }
        ];
        seriesToMakeVisible.forEach((r) => {
          const cs = (
            /** @type {any} */
            r.cs
          );
          const csi = (
            /** @type {any} */
            r.csi
          );
          this.riseCollapsedSeries(
            cs,
            csi,
            /** @type {number} */
            realIndex
          );
        });
      } else {
        this.hideSeries({ seriesEl, realIndex });
      }
      if (w2.config.chart.accessibility.enabled) {
        const legendItem = w2.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`
        );
        if (legendItem) {
          const isCollapsed = w2.globals.collapsedSeriesIndices.includes(realIndex) || w2.globals.ancillaryCollapsedSeriesIndices.includes(realIndex);
          legendItem.setAttribute(
            "aria-pressed",
            isCollapsed ? "true" : "false"
          );
          const legendTextEl = legendItem.querySelector(
            ".apexcharts-legend-text"
          );
          const seriesName = legendTextEl ? legendTextEl.textContent : w2.seriesData.seriesNames[seriesCnt];
          const statusText = isCollapsed ? "hidden" : "visible";
          legendItem.setAttribute(
            "aria-label",
            `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
          );
        }
      }
    } else {
      w2.globals.resized = true;
      w2.globals.risingSeries = [];
      if (isHidden) {
        this.riseCollapsedSeries(
          w2.globals.collapsedSeries,
          w2.globals.collapsedSeriesIndices,
          seriesCnt
        );
      } else {
        const series = this.getSeriesAfterCollapsing({ realIndex: seriesCnt });
        this.lgCtx.updateSeries(
          series,
          w2.config.chart.animations.dynamicAnimation.enabled
        );
      }
      if (w2.config.chart.accessibility.enabled) {
        const legendItem = w2.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`
        );
        if (legendItem) {
          const isCollapsed = w2.globals.collapsedSeriesIndices.includes(seriesCnt);
          legendItem.setAttribute(
            "aria-pressed",
            isCollapsed ? "true" : "false"
          );
          const legendTextEl = legendItem.querySelector(
            ".apexcharts-legend-text"
          );
          const seriesName = legendTextEl ? legendTextEl.textContent : w2.seriesData.seriesNames[seriesCnt];
          const statusText = isCollapsed ? "hidden" : "visible";
          legendItem.setAttribute(
            "aria-label",
            `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
          );
        }
      }
    }
  }
  /**
   * Non-axis "slice" container. A pie/donut/polarArea slice is normally a
   * top-level series element (numeric form: `series = [n, n, n]`), but object
   * form (`series = [{ data: [{ x, y, drilldown }, ...] }]`, which pie/donut
   * drilldown requires) packs every slice as a data point inside a single
   * series. Return the array that actually holds the slice values so a
   * slice/legend index addresses the right thing. Scoped to the pie family so
   * unit charts (which share this non-axis path) are untouched.
   * @param {any[]} series
   * @returns {any[]}
   */
  _nonAxisSliceContainer(series) {
    const type = this.w.config.chart.type;
    if ((type === "pie" || type === "donut" || type === "polarArea" || type === "sunburst") && series.length === 1 && series[0] && typeof series[0] === "object" && Array.isArray(series[0].data)) {
      return series[0].data;
    }
    return series;
  }
  /**
   * Read a non-axis slice value (handles `{ x, y }` data points and plain
   * numbers).
   * @param {any} sliceEntry
   * @returns {number}
   */
  _readSliceValue(sliceEntry) {
    if (this.w.config.chart.type === "unit" && sliceEntry && Array.isArray(sliceEntry.data)) {
      return sliceEntry.data;
    }
    return sliceEntry && typeof sliceEntry === "object" ? sliceEntry.y : sliceEntry;
  }
  /**
   * Write a non-axis slice value in place, preserving `{ x, drilldown, ... }`
   * on object data points.
   * @param {any[]} container
   * @param {number} i
   * @param {number} value
   */
  _writeSliceValue(container, i, value) {
    const entry = container[i];
    if (this.w.config.chart.type === "unit" && entry && Array.isArray(entry.data)) {
      entry.data = Array.isArray(value) ? value : [];
      return;
    }
    if (entry && typeof entry === "object") {
      entry.y = value;
    } else {
      container[i] = value;
    }
  }
  /** @param {{realIndex: any}} opts */
  getSeriesAfterCollapsing({ realIndex }) {
    var _a, _b;
    const w2 = this.w;
    const gl = w2.globals;
    const series = Utils.clone(w2.config.series);
    if (gl.axisCharts) {
      const yaxis = w2.config.yaxis[gl.seriesYAxisReverseMap[realIndex]];
      const collapseData = {
        index: realIndex,
        data: series[realIndex].data.slice(),
        type: series[realIndex].type || w2.config.chart.type,
        // The category name pins the hide across a data update that reorders or
        // regroups categories (e.g. a storyboard beat): the collapse is
        // reconciled by name, not index. See Series.reconcileCollapsedByName.
        name: (gl.seriesNames || [])[realIndex]
      };
      if (yaxis && yaxis.show && yaxis.showAlways) {
        if (gl.ancillaryCollapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.ancillaryCollapsedSeries.push(collapseData);
          gl.ancillaryCollapsedSeriesIndices.push(realIndex);
        }
      } else {
        if (gl.collapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.collapsedSeries.push(collapseData);
          gl.collapsedSeriesIndices.push(realIndex);
          const removeIndexOfRising = gl.risingSeries.indexOf(realIndex);
          gl.risingSeries.splice(removeIndexOfRising, 1);
        }
      }
    } else {
      if (gl.collapsedSeriesIndices.indexOf(realIndex) < 0) {
        const container = this._nonAxisSliceContainer(series);
        gl.collapsedSeries.push({
          index: realIndex,
          // Store the original slice VALUE so it can be restored on rise. In
          // object form this is a data point's `y`, not the whole series entry.
          data: this._readSliceValue(container[realIndex]),
          type: (
            /** @type {any} */
            (_b = (_a = w2.config.series[realIndex]) == null ? void 0 : _a.type) != null ? _b : "line"
          ),
          // Pin the hide by category name so it survives a regroup (see above).
          name: (gl.seriesNames || [])[realIndex]
        });
        gl.collapsedSeriesIndices.push(realIndex);
      }
    }
    const seriesCount = gl.axisCharts ? w2.config.series.length : this._nonAxisSliceContainer(series).length;
    gl.allSeriesCollapsed = gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length === seriesCount;
    return this._getSeriesBasedOnCollapsedState(series);
  }
  /** @param {{seriesEl: any, realIndex: any}} opts */
  hideSeries({ seriesEl, realIndex }) {
    const w2 = this.w;
    const series = this.getSeriesAfterCollapsing({
      realIndex
    });
    const seriesChildren = seriesEl.childNodes;
    for (let sc = 0; sc < seriesChildren.length; sc++) {
      if (seriesChildren[sc].classList.contains("apexcharts-series-markers-wrap")) {
        if (seriesChildren[sc].classList.contains("apexcharts-hide")) {
          seriesChildren[sc].classList.remove("apexcharts-hide");
        } else {
          seriesChildren[sc].classList.add("apexcharts-hide");
        }
      }
    }
    const animate = w2.config.chart.animations.dynamicAnimation.enabled;
    if (animate) {
      w2.globals.collapsingSeriesIndices = [realIndex];
    }
    const clearCollapsing = () => {
      w2.globals.collapsingSeriesIndices = [];
    };
    const updated = this.lgCtx.updateSeries(series, animate);
    clearCollapsing();
    if (updated && typeof updated.then === "function") {
      updated.then(clearCollapsing, clearCollapsing);
    }
  }
  /**
   * @param {any[]} collapsedSeries
   * @param {number[]} seriesIndices
   * @param {number} realIndex
   */
  riseCollapsedSeries(collapsedSeries, seriesIndices, realIndex) {
    const w2 = this.w;
    let series = Utils.clone(w2.config.series);
    if (collapsedSeries.length > 0) {
      for (let c = 0; c < collapsedSeries.length; c++) {
        if (collapsedSeries[c].index === realIndex) {
          if (w2.globals.axisCharts) {
            series[realIndex].data = collapsedSeries[c].data.slice();
            series[realIndex].hidden = false;
          } else {
            const container = this._nonAxisSliceContainer(series);
            this._writeSliceValue(container, realIndex, collapsedSeries[c].data);
          }
          collapsedSeries.splice(c, 1);
          seriesIndices.splice(c, 1);
          w2.globals.risingSeries.push(realIndex);
          c--;
        }
      }
      series = this._getSeriesBasedOnCollapsedState(series);
      this.lgCtx.updateSeries(
        series,
        w2.config.chart.animations.dynamicAnimation.enabled
      );
    }
  }
  /**
   * @param {any[]} series
   */
  _getSeriesBasedOnCollapsedState(series) {
    const w2 = this.w;
    let collapsed = 0;
    if (w2.globals.axisCharts) {
      series.forEach((s, sI) => {
        if (!(w2.globals.collapsedSeriesIndices.indexOf(sI) < 0 && w2.globals.ancillaryCollapsedSeriesIndices.indexOf(sI) < 0)) {
          series[sI].data = [];
          collapsed++;
        }
      });
    } else {
      const container = this._nonAxisSliceContainer(series);
      container.forEach((s, sI) => {
        if (!(w2.globals.collapsedSeriesIndices.indexOf(sI) < 0)) {
          this._writeSliceValue(container, sI, 0);
          collapsed++;
        }
      });
    }
    const seriesCount = w2.globals.axisCharts ? series.length : this._nonAxisSliceContainer(series).length;
    w2.globals.allSeriesCollapsed = collapsed === seriesCount;
    return series;
  }
};
const DEFAULT_DIVERGING = ["#cf4d3f", "#8f9499", "#26a75b"];
const lerp$1 = (a, b2, t) => a + (b2 - a) * t;
function toHexPair(n) {
  const v2 = Math.max(0, Math.min(255, Math.round(n)));
  return v2.toString(16).padStart(2, "0");
}
function mixColors(c1, c2, t) {
  const a = Utils.parseHex(normalizeHex(c1));
  const b2 = Utils.parseHex(normalizeHex(c2));
  if (!a || !b2) return c1;
  return "#" + toHexPair(lerp$1(a[0], b2[0], t)) + toHexPair(lerp$1(a[1], b2[1], t)) + toHexPair(lerp$1(a[2], b2[2], t));
}
function normalizeHex(c) {
  if (typeof c !== "string") return "#000000";
  if (Utils.isColorHex(c)) return c;
  const asHex = Utils.rgb2hex(c);
  return asHex || "#000000";
}
function colorValueOf(w2, i, j) {
  const series = (
    /** @type {any} */
    w2.config.series[i]
  );
  const datum = series && Array.isArray(series.data) ? series.data[j] : null;
  return colorValueOfDatum(w2, datum, i, j);
}
function colorValueOfDatum(w2, datum, i, j) {
  var _a, _b, _c;
  if (!datum || typeof datum !== "object") return null;
  const accessor = (_c = (_b = (_a = w2.config.plotOptions) == null ? void 0 : _a.treemap) == null ? void 0 : _b.colorScale) == null ? void 0 : _c.colorValue;
  let raw;
  if (typeof accessor === "function") {
    raw = accessor(datum, { seriesIndex: i, dataPointIndex: j, w: w2 });
  } else if (typeof accessor === "string") {
    raw = datum[accessor];
  } else {
    raw = datum.colorValue;
  }
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function resolveStops(cfg, min, max, midpoint) {
  if (Array.isArray(cfg.stops) && cfg.stops.length >= 2) {
    return cfg.stops.filter((s) => s && Number.isFinite(Number(s.value))).map((s) => ({
      value: Number(s.value),
      color: normalizeHex(s.color)
    })).sort(
      (a, b2) => a.value - b2.value
    );
  }
  const colors = (Array.isArray(cfg.colors) && cfg.colors.length >= 2 ? cfg.colors : DEFAULT_DIVERGING).map(normalizeHex);
  const n = colors.length;
  if (midpoint != null && n >= 3) {
    const mid = Math.floor((n - 1) / 2);
    const out = [];
    for (let k = 0; k <= mid; k++) {
      out.push({ value: lerp$1(min, midpoint, k / mid), color: colors[k] });
    }
    for (let k = mid + 1; k < n; k++) {
      out.push({
        value: lerp$1(midpoint, max, (k - mid) / (n - 1 - mid)),
        color: colors[k]
      });
    }
    return out;
  }
  return colors.map((c, k) => ({
    value: lerp$1(min, max, k / (n - 1)),
    color: c
  }));
}
function buildContinuousScale(w2) {
  var _a, _b, _c;
  const cs = (_c = (_b = (_a = w2.config) == null ? void 0 : _a.plotOptions) == null ? void 0 : _b.treemap) == null ? void 0 : _c.colorScale;
  const cfg = cs && cs.gradient;
  if (!cfg) return null;
  if (cfg.enabled === false) return null;
  const series = (
    /** @type {any} */
    w2.config.series || []
  );
  let dataMin = Infinity;
  let dataMax = -Infinity;
  let found = false;
  for (let i = 0; i < series.length; i++) {
    const data = series[i] && series[i].data;
    if (!Array.isArray(data)) continue;
    for (let j = 0; j < data.length; j++) {
      const v2 = colorValueOfDatum(w2, data[j], i, j);
      if (v2 == null) continue;
      found = true;
      if (v2 < dataMin) dataMin = v2;
      if (v2 > dataMax) dataMax = v2;
    }
  }
  if (!found && cfg.enabled !== true) return null;
  if (!Number.isFinite(dataMin)) {
    dataMin = 0;
    dataMax = 0;
  }
  let min = Number.isFinite(Number(cfg.min)) ? Number(cfg.min) : dataMin;
  let max = Number.isFinite(Number(cfg.max)) ? Number(cfg.max) : dataMax;
  let midpoint = null;
  if (cfg.midpoint === null) {
    midpoint = null;
  } else if (Number.isFinite(Number(cfg.midpoint))) {
    midpoint = Number(cfg.midpoint);
  } else if (min < 0 && max > 0) {
    midpoint = 0;
  }
  if (midpoint != null && cfg.symmetric !== false && !Number.isFinite(Number(cfg.min)) && !Number.isFinite(Number(cfg.max))) {
    const reach = Math.max(Math.abs(min - midpoint), Math.abs(max - midpoint));
    min = midpoint - reach;
    max = midpoint + reach;
  }
  if (max === min) {
    min -= 0.5;
    max += 0.5;
  }
  const stops = resolveStops(cfg, min, max, midpoint);
  if (stops.length < 2) return null;
  const at = (v2) => {
    if (!Number.isFinite(v2)) return stops[Math.floor(stops.length / 2)].color;
    if (v2 <= stops[0].value) return stops[0].color;
    const last = stops[stops.length - 1];
    if (v2 >= last.value) return last.color;
    for (let k = 1; k < stops.length; k++) {
      const hi = stops[k];
      if (v2 <= hi.value) {
        const lo = stops[k - 1];
        const span2 = hi.value - lo.value;
        const t = span2 === 0 ? 0 : (v2 - lo.value) / span2;
        return mixColors(lo.color, hi.color, t);
      }
    }
    return last.color;
  };
  const span = max - min;
  const legendStops = stops.map((s) => ({
    percent: span === 0 ? 0 : (s.value - min) / span,
    color: s.color
  }));
  return { min, max, midpoint, stops, at, legendStops };
}
function readableOn(bg) {
  const hex = normalizeHex(bg);
  return Utils.getContrastRatio(hex, "#ffffff") >= Utils.getContrastRatio(hex, "#000000") ? "#ffffff" : "#000000";
}
const SVG_NS = "http://www.w3.org/2000/svg";
class HeatmapGradientLegend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    this.svgEl = null;
    this.arrowEl = null;
    this.hoverValueEl = null;
    this._min = 0;
    this._max = 0;
    this._geom = null;
    this._bandHitEls = [];
    this._activeBandIndex = -1;
    this._targetEl = null;
    this._onCellEnter = this._onCellEnter.bind(this);
    this._onCellLeave = this._onCellLeave.bind(this);
    this._onBandEnter = this._onBandEnter.bind(this);
    this._onBandLeave = this._onBandLeave.bind(this);
  }
  /** Default value formatter for min/max labels and the hover tooltip. */
  _getFormatter() {
    const cfg = this._cfg();
    if (typeof cfg.formatter === "function") return cfg.formatter;
    return (v2) => {
      if (!Number.isFinite(v2)) return String(v2);
      const abs = Math.abs(v2);
      if (abs >= 1e3) return v2.toFixed(0);
      if (abs >= 10) return v2.toFixed(1);
      return v2.toFixed(2);
    };
  }
  /**
   * The colorScale of whichever chart type is being drawn. Every chart type
   * that encodes a value as colour carries the same `colorScale` shape, so one
   * strip serves them all rather than a near-copy per type.
   * @param {any} w
   */
  static colorScaleOf(w2) {
    var _a, _b, _c, _d, _e;
    const type = (_b = (_a = w2 == null ? void 0 : w2.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    if (!type) return null;
    return ((_e = (_d = (_c = w2 == null ? void 0 : w2.config) == null ? void 0 : _c.plotOptions) == null ? void 0 : _d[type]) == null ? void 0 : _e.colorScale) || null;
  }
  /**
   * @param {any} w
   */
  static configFor(w2) {
    const cs = HeatmapGradientLegend.colorScaleOf(w2);
    return cs && cs.gradientLegend || null;
  }
  /** This instance's gradient-legend config. */
  _cfg() {
    return HeatmapGradientLegend.configFor(this.w) || {};
  }
  /**
   * True when the user has opted into the gradient legend variant.
   * @param {any} w
   */
  static isEnabled(w2) {
    if (!HeatmapGradientLegend.supports(w2)) return false;
    const cfg = HeatmapGradientLegend.configFor(w2);
    return !!(cfg && cfg.enabled);
  }
  /**
   * Chart types this legend can serve: those that encode a value as colour
   * through a `colorScale`. Everything else gets the categorical legend.
   * @param {any} w
   */
  static supports(w2) {
    var _a, _b;
    const type = (_b = (_a = w2 == null ? void 0 : w2.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    return type === "heatmap" || type === "treemap";
  }
  /**
   * Build the gradient legend DOM into `elLegendWrap`.
   * Caller is responsible for clearing the wrap first.
   * @param {HTMLElement|null} [targetEl] detached mode: draw into this
   *   element instead (a trellis's shared legend slot); the host owns layout,
   *   so all plot-relative positioning is skipped.
   */
  draw(targetEl = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w2 = this.w;
    this._targetEl = targetEl;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      targetEl || w2.dom.elLegendWrap
    );
    if (!elLegendWrap) return;
    const cfg = this._cfg();
    const position = w2.config.legend.position;
    const isVertical = position === "left" || position === "right";
    const arrowSize = (_b = (_a = cfg.arrow) == null ? void 0 : _a.size) != null ? _b : 8;
    const arrowGutter = arrowSize + 4;
    const labelPadAlongStrip = cfg.showLabels ? 28 : 4;
    const labelPadAcrossStrip = cfg.showLabels ? 20 : 4;
    const minLabelWidth = cfg.showLabels ? 44 : 0;
    const stripLength = this._resolveStripLength(isVertical ? cfg.height : cfg.width, isVertical);
    const stripThickness = cfg.thickness;
    const svgWidth = isVertical ? Math.max(stripThickness + arrowGutter + 4, minLabelWidth) : stripLength + labelPadAlongStrip * 2;
    const svgHeight = isVertical ? stripLength + labelPadAcrossStrip * 2 : stripThickness + arrowGutter + 4;
    const verticalGroupWidth = stripThickness + arrowGutter;
    const verticalGroupLeftPad = (svgWidth - verticalGroupWidth) / 2;
    const stripX = isVertical ? position === "left" ? verticalGroupLeftPad : verticalGroupLeftPad + arrowGutter : labelPadAlongStrip;
    const stripY = isVertical ? labelPadAcrossStrip : position === "top" ? arrowGutter : 4;
    const svg = BrowserAPIs.createElementNS(SVG_NS, "svg");
    svg.setAttribute(
      "class",
      "apexcharts-heatmap-gradient-legend apexcharts-gradient-legend"
    );
    svg.setAttribute("width", String(svgWidth));
    svg.setAttribute("height", String(svgHeight));
    svg.setAttribute("overflow", "visible");
    const defs = BrowserAPIs.createElementNS(SVG_NS, "defs");
    const gradId = `apexcharts-heatmap-gradient-${w2.globals.cuid}`;
    const linearGrad = BrowserAPIs.createElementNS(SVG_NS, "linearGradient");
    linearGrad.setAttribute("id", gradId);
    if (isVertical) {
      linearGrad.setAttribute("x1", "0");
      linearGrad.setAttribute("y1", "1");
      linearGrad.setAttribute("x2", "0");
      linearGrad.setAttribute("y2", "0");
    } else {
      linearGrad.setAttribute("x1", "0");
      linearGrad.setAttribute("y1", "0");
      linearGrad.setAttribute("x2", "1");
      linearGrad.setAttribute("y2", "0");
    }
    const { min, max, stops, bands } = this._computeStops();
    this._min = min;
    this._max = max;
    stops.forEach((s) => {
      const stopEl = BrowserAPIs.createElementNS(SVG_NS, "stop");
      stopEl.setAttribute("offset", `${(s.percent * 100).toFixed(2)}%`);
      stopEl.setAttribute("stop-color", s.color);
      linearGrad.appendChild(stopEl);
    });
    defs.appendChild(linearGrad);
    svg.appendChild(defs);
    const rect = BrowserAPIs.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(stripX));
    rect.setAttribute("y", String(stripY));
    rect.setAttribute("width", String(isVertical ? stripThickness : stripLength));
    rect.setAttribute("height", String(isVertical ? stripLength : stripThickness));
    rect.setAttribute("rx", "2");
    rect.setAttribute("fill", `url(#${gradId})`);
    svg.appendChild(rect);
    if (cfg.showLabels) {
      const labelColor = ((_c = cfg.labelStyle) == null ? void 0 : _c.colors) || (Array.isArray(w2.config.legend.labels.colors) ? w2.config.legend.labels.colors[0] : w2.config.legend.labels.colors) || w2.config.chart.foreColor;
      const labelFontSize = ((_d = cfg.labelStyle) == null ? void 0 : _d.fontSize) || "11px";
      const labelFontFamily = ((_e = cfg.labelStyle) == null ? void 0 : _e.fontFamily) || w2.config.chart.fontFamily;
      const fmt = this._getFormatter();
      const makeLabel = (text, x, y, anchor) => {
        const t = BrowserAPIs.createElementNS(SVG_NS, "text");
        t.setAttribute("x", String(x));
        t.setAttribute("y", String(y));
        t.setAttribute("text-anchor", anchor);
        t.setAttribute("dominant-baseline", "middle");
        t.setAttribute("fill", labelColor);
        t.setAttribute("font-size", labelFontSize);
        if (labelFontFamily) t.setAttribute("font-family", labelFontFamily);
        t.textContent = String(text);
        return t;
      };
      if (isVertical) {
        const midX = stripX + stripThickness / 2;
        svg.appendChild(makeLabel(fmt(min), midX, stripY + stripLength + 10, "middle"));
        svg.appendChild(makeLabel(fmt(max), midX, stripY - 10, "middle"));
      } else {
        const midY = stripY + stripThickness / 2;
        svg.appendChild(makeLabel(fmt(min), stripX - 6, midY, "end"));
        svg.appendChild(makeLabel(fmt(max), stripX + stripLength + 6, midY, "start"));
      }
    }
    const arrowColor = ((_f = cfg.arrow) == null ? void 0 : _f.color) || w2.config.chart.foreColor;
    const arrow = this._buildArrow(arrowSize, arrowColor, position);
    svg.appendChild(arrow);
    this.arrowEl = arrow;
    this._bandHitEls = [];
    if (w2.config.legend.onItemHover.highlightDataSeries && bands.length > 0) {
      bands.forEach((b2) => {
        const hit = BrowserAPIs.createElementNS(SVG_NS, "rect");
        if (isVertical) {
          const yTop = stripY + stripLength - b2.p2 * stripLength;
          const yBot = stripY + stripLength - b2.p1 * stripLength;
          hit.setAttribute("x", String(stripX));
          hit.setAttribute("y", String(yTop));
          hit.setAttribute("width", String(stripThickness));
          hit.setAttribute("height", String(Math.max(0, yBot - yTop)));
        } else {
          hit.setAttribute("x", String(stripX + b2.p1 * stripLength));
          hit.setAttribute("y", String(stripY));
          hit.setAttribute(
            "width",
            String(Math.max(0, (b2.p2 - b2.p1) * stripLength))
          );
          hit.setAttribute("height", String(stripThickness));
        }
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("class", "apexcharts-heatmap-gradient-band");
        hit.setAttribute("data:range-index", String(b2.index));
        hit.style.cursor = "pointer";
        svg.appendChild(hit);
        this._bandHitEls.push(hit);
      });
    }
    this._geom = {
      isVertical,
      position,
      stripX,
      stripY,
      stripLength,
      stripThickness,
      arrowSize,
      svgWidth,
      svgHeight
    };
    if (cfg.showHoverValue) {
      const tt = BrowserAPIs.createElement("div");
      tt.classList.add("apexcharts-heatmap-gradient-legend-value");
      tt.style.position = "absolute";
      tt.style.fontSize = ((_g = cfg.labelStyle) == null ? void 0 : _g.fontSize) || "11px";
      tt.style.fontFamily = ((_h = cfg.labelStyle) == null ? void 0 : _h.fontFamily) || w2.config.chart.fontFamily || "";
      tt.style.color = w2.config.chart.foreColor;
      tt.style.background = "rgba(0,0,0,0.65)";
      tt.style.color = "#fff";
      tt.style.padding = "2px 6px";
      tt.style.borderRadius = "3px";
      tt.style.pointerEvents = "none";
      tt.style.whiteSpace = "nowrap";
      tt.style.opacity = "0";
      tt.style.transition = "opacity 120ms ease";
      this.hoverValueEl = tt;
    }
    elLegendWrap.classList.add("apexcharts-heatmap-gradient-legend-wrap");
    elLegendWrap.classList.add(
      "apx-legend-position-" + position
    );
    elLegendWrap.appendChild(svg);
    if (this.hoverValueEl) elLegendWrap.appendChild(this.hoverValueEl);
    this.svgEl = svg;
    if (targetEl) {
      elLegendWrap.style.width = svgWidth + "px";
      elLegendWrap.style.height = svgHeight + "px";
      elLegendWrap.style.position = "relative";
      elLegendWrap.style.overflow = "visible";
    } else {
      this._applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight);
    }
    this._attachHoverListeners();
    this._attachBandHoverListeners();
  }
  /**
   * Resolve a configured length (number = px, string ending in '%' =
   * percentage of the chart's SVG width/height) to a pixel length.
   * @param {number|string} value
   * @param {boolean} isVertical
   * @returns {number}
   */
  _resolveStripLength(value, isVertical) {
    const w2 = this.w;
    const basis = isVertical ? w2.globals.svgHeight || w2.config.chart.height || 300 : w2.globals.svgWidth || w2.config.chart.width || 600;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.endsWith("%")) {
        const pct = parseFloat(trimmed) || 0;
        return Math.max(20, basis * pct / 100);
      }
      const n = parseFloat(trimmed);
      return Number.isFinite(n) ? n : 200;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return 200;
  }
  /**
   * Position the legend wrap and align the gradient strip within it. The
   * wrap spans the chart's long axis (full width for top/bottom; full
   * height for left/right) and uses flexbox to honor the `align` config.
   * Bypasses the standard `setLegendWrapXY` which sizes the wrap to its
   * content.
   * @param {HTMLElement} elLegendWrap
   * @param {'top'|'right'|'bottom'|'left'} position
   * @param {boolean} isVertical
   * @param {number} svgWidth
   * @param {number} svgHeight
   */
  _applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight) {
    const w2 = this.w;
    const cfg = this._cfg();
    const align = cfg.align || "center";
    const edgePad = 12;
    const chartWidth = w2.globals.svgWidth || w2.config.chart.width || 600;
    const chartHeight = w2.globals.svgHeight || w2.config.chart.height || 300;
    const userOffsetX = w2.config.legend.offsetX || 0;
    const userOffsetY = w2.config.legend.offsetY || 0;
    elLegendWrap.style.position = "absolute";
    elLegendWrap.style.display = "block";
    elLegendWrap.style.overflow = "visible";
    elLegendWrap.style.padding = "0";
    elLegendWrap.style.width = svgWidth + "px";
    elLegendWrap.style.height = svgHeight + "px";
    elLegendWrap.style.right = "auto";
    elLegendWrap.style.bottom = "auto";
    if (isVertical) {
      const availableHeight = chartHeight - svgHeight - edgePad * 2;
      let y;
      if (align === "start") y = edgePad;
      else if (align === "end") y = edgePad + Math.max(0, availableHeight);
      else y = edgePad + Math.max(0, availableHeight) / 2;
      elLegendWrap.style.top = y + userOffsetY + "px";
      if (position === "left") {
        elLegendWrap.style.left = edgePad + userOffsetX + "px";
      } else {
        elLegendWrap.style.left = chartWidth - svgWidth - edgePad + userOffsetX + "px";
      }
    } else {
      const availableWidth = chartWidth - svgWidth - edgePad * 2;
      let x;
      if (align === "start") x = edgePad;
      else if (align === "end") x = edgePad + Math.max(0, availableWidth);
      else x = edgePad + Math.max(0, availableWidth) / 2;
      elLegendWrap.style.left = x + userOffsetX + "px";
      if (position === "top") {
        elLegendWrap.style.top = edgePad + userOffsetY + "px";
      } else {
        elLegendWrap.style.top = chartHeight - svgHeight - edgePad + userOffsetY + "px";
      }
    }
  }
  /**
   * Re-position the strip once the final layout is known.
   *
   * `_applyWrapAlignment` (called during `draw()`, before `plotCoords()`) can
   * only pin to the chart's outer edge. This runs after layout — when
   * `translateX/Y`, `gridWidth/Height` and `xAxisHeight` are populated — and:
   *   - centers the strip within its reserved band on the perpendicular axis
   *     (between the title and the plot for `top`; the x-axis and the chart
   *     bottom for `bottom`; the chart edge and the plot for `left`/`right`),
   *     so the slack is split evenly instead of dumped on one side, and
   *   - aligns it along the plot's own extent (so `align: 'center'` centers
   *     over the heatmap, not the whole canvas).
   * Honors `legend.offsetX/offsetY` for user nudging. Safe to call repeatedly.
   */
  repositionToPlot() {
    var _a, _b;
    if (!Environment.isBrowser()) return;
    if (this._targetEl) return;
    const w2 = this.w;
    const g2 = w2.globals;
    const wrap = (
      /** @type {HTMLElement} */
      w2.dom.elLegendWrap
    );
    if (!wrap || !this._geom) return;
    if (!Number.isFinite(g2.gridWidth) || !Number.isFinite(g2.gridHeight)) return;
    const { isVertical, position, svgWidth, svgHeight, stripX, stripY, stripThickness } = this._geom;
    const align = this._cfg().align || "center";
    const ox = w2.config.legend.offsetX || 0;
    const oy = w2.config.legend.offsetY || 0;
    const dimHelpers = (_b = (_a = this.ctx) == null ? void 0 : _a.dimensions) == null ? void 0 : _b.dimHelpers;
    const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
    const xAxisArea = w2.layout.xAxisHeight || 0;
    const alongOffset = (extent, size) => {
      const avail = Math.max(0, extent - size);
      if (align === "start") return 0;
      if (align === "end") return avail;
      return avail / 2;
    };
    if (isVertical) {
      wrap.style.top = g2.translateY + alongOffset(g2.gridHeight, svgHeight) + oy + "px";
      const bandStart = position === "left" ? 0 : g2.translateX + g2.gridWidth;
      const bandEnd = position === "left" ? g2.translateX : g2.svgWidth;
      const stripCenter = (bandStart + bandEnd) / 2;
      wrap.style.left = stripCenter - stripX - stripThickness / 2 + ox + "px";
    } else {
      wrap.style.left = g2.translateX + alongOffset(g2.gridWidth, svgWidth) + ox + "px";
      const bandStart = position === "top" ? titleArea : g2.translateY + g2.gridHeight + xAxisArea;
      const bandEnd = position === "top" ? g2.translateY : g2.svgHeight;
      const stripCenter = (bandStart + bandEnd) / 2;
      wrap.style.top = stripCenter - stripY - stripThickness / 2 + oy + "px";
    }
    BrowserAPIs.requestAnimationFrame(() => this._enforceMinPlotGap());
  }
  /**
   * Guarantee a minimum gap between the strip's chart-facing edge and the plot.
   * Measured in viewport space (immune to the wrap↔SVG coordinate offset) and
   * applied as a *relative* shift to the wrap's current position, so it only
   * nudges a strip that ended up too close — placements with ample room are
   * left exactly where centering put them. Runs post-paint (see caller).
   */
  _enforceMinPlotGap() {
    const w2 = this.w;
    const wrap = (
      /** @type {HTMLElement} */
      w2.dom.elLegendWrap
    );
    const strip = this.svgEl && this.svgEl.querySelector("rect");
    const grid = w2.dom.baseEl.querySelector(".apexcharts-grid");
    if (!wrap || !strip || !grid || !this._geom) return;
    const s = strip.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    if (!s.width || !s.height || !gr.width || !gr.height) return;
    const MIN_GAP = 16;
    const { isVertical, position } = this._geom;
    if (isVertical) {
      const gap = position === "left" ? gr.left - s.right : s.left - gr.right;
      if (gap < MIN_GAP) {
        const curLeft = parseFloat(wrap.style.left) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.left = curLeft + (position === "left" ? -shift : shift) + "px";
      }
    } else {
      const gap = position === "top" ? gr.top - s.bottom : s.top - gr.bottom;
      if (gap < MIN_GAP) {
        const curTop = parseFloat(wrap.style.top) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.top = curTop + (position === "top" ? -shift : shift) + "px";
      }
    }
  }
  /**
   * Tear down listeners (called before re-render).
   */
  destroy() {
    var _a, _b, _c, _d, _e, _f, _g;
    for (let i = 0; i < this._bandHitEls.length; i++) {
      const el = this._bandHitEls[i];
      (_a = el.removeEventListener) == null ? void 0 : _a.call(el, "mousemove", this._onBandEnter);
      (_b = el.removeEventListener) == null ? void 0 : _b.call(el, "mouseout", this._onBandLeave);
    }
    this._bandHitEls = [];
    this._activeBandIndex = -1;
    if (!((_c = this.ctx) == null ? void 0 : _c.events)) return;
    try {
      (_e = (_d = this.ctx.events).removeEventListener) == null ? void 0 : _e.call(
        _d,
        "dataPointMouseEnter",
        this._onCellEnter
      );
      (_g = (_f = this.ctx.events).removeEventListener) == null ? void 0 : _g.call(
        _f,
        "dataPointMouseLeave",
        this._onCellLeave
      );
    } catch (_) {
    }
  }
  /** Wire mousemove/mouseout on each per-band hit-region (ranges mode). */
  _attachBandHoverListeners() {
    if (!Environment.isBrowser()) return;
    for (let i = 0; i < this._bandHitEls.length; i++) {
      const el = this._bandHitEls[i];
      el.addEventListener("mousemove", this._onBandEnter);
      el.addEventListener("mouseout", this._onBandLeave);
    }
  }
  /**
   * Hovering a gradient band highlights its cells and dims the rest. Guarded
   * so the repeated mousemove stream only re-applies on an actual band change.
   * @param {Event} e
   */
  _onBandEnter(e) {
    var _a, _b, _c, _d;
    const w2 = this.w;
    const target = (
      /** @type {Element} */
      e.currentTarget
    );
    const idx = parseInt((_a = target.getAttribute("data:range-index")) != null ? _a : "-1", 10);
    if (idx < 0 || idx === this._activeBandIndex) return;
    this._activeBandIndex = idx;
    (_d = (_c = (_b = this.ctx) == null ? void 0 : _b.events) == null ? void 0 : _c.fireEvent) == null ? void 0 : _d.call(_c, "legendHover", [this.ctx, idx, w2]);
    new Series(w2).highlightRangeInSeries(idx, "highlight");
  }
  /** Leaving a band clears the highlight. */
  _onBandLeave() {
    if (this._activeBandIndex < 0) return;
    const idx = this._activeBandIndex;
    this._activeBandIndex = -1;
    new Series(this.w).highlightRangeInSeries(idx, "reset");
  }
  _attachHoverListeners() {
    var _a, _b;
    if (!Environment.isBrowser()) return;
    if (!((_b = (_a = this.ctx) == null ? void 0 : _a.events) == null ? void 0 : _b.addEventListener)) return;
    this.ctx.events.addEventListener(
      "dataPointMouseEnter",
      this._onCellEnter
    );
    this.ctx.events.addEventListener(
      "dataPointMouseLeave",
      this._onCellLeave
    );
  }
  /**
   * dataPointMouseEnter fires as `(e, ctx, { seriesIndex, dataPointIndex, w })`.
   * Graphics._fireEvent forwards listener args in the same shape.
   * @param {...any} args
   */
  _onCellEnter(...args) {
    var _a, _b, _c;
    const w2 = this.w;
    if (!this.arrowEl) return;
    const opts = args[args.length - 1];
    if (!opts || typeof opts !== "object") return;
    const i = opts.seriesIndex;
    const j = opts.dataPointIndex;
    if (typeof i !== "number" || typeof j !== "number") return;
    if (!HeatmapGradientLegend.supports(w2)) return;
    let val;
    if (this._continuous) {
      val = colorValueOf(w2, i, j);
    } else {
      val = (_c = (_b = (_a = w2.seriesData) == null ? void 0 : _a.series) == null ? void 0 : _b[i]) == null ? void 0 : _c[j];
    }
    if (val == null || Number.isNaN(val)) return;
    this._positionArrow(val);
  }
  _onCellLeave() {
    if (!this.arrowEl) return;
    this.arrowEl.setAttribute("opacity", "0");
    if (this.hoverValueEl) {
      this.hoverValueEl.style.opacity = "0";
    }
  }
  /**
   * Move the arrow to the position corresponding to `val` along the strip.
   * @param {number} val
   */
  _positionArrow(val) {
    if (!this.arrowEl || !this._geom) return;
    const { isVertical, position, stripX, stripY, stripLength, stripThickness, arrowSize } = this._geom;
    const min = this._min;
    const max = this._max;
    const span = max - min;
    let pct;
    if (span === 0) {
      pct = 0.5;
    } else {
      pct = (val - min) / span;
    }
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    if (isVertical) {
      const yCenter = stripY + stripLength - pct * stripLength;
      let tipX, baseX;
      if (position === "left") {
        tipX = stripX + stripThickness;
        baseX = tipX + arrowSize;
      } else {
        tipX = stripX;
        baseX = tipX - arrowSize;
      }
      const points = [
        `${tipX},${yCenter}`,
        `${baseX},${yCenter - arrowSize / 2}`,
        `${baseX},${yCenter + arrowSize / 2}`
      ].join(" ");
      this.arrowEl.setAttribute("points", points);
    } else {
      const xCenter = stripX + pct * stripLength;
      let tipY, baseY;
      if (position === "top") {
        tipY = stripY + stripThickness;
        baseY = tipY + arrowSize;
      } else {
        tipY = stripY;
        baseY = tipY - arrowSize;
      }
      const points = [
        `${xCenter},${tipY}`,
        `${xCenter - arrowSize / 2},${baseY}`,
        `${xCenter + arrowSize / 2},${baseY}`
      ].join(" ");
      this.arrowEl.setAttribute("points", points);
    }
    this.arrowEl.setAttribute("opacity", "1");
    if (this.hoverValueEl) {
      const fmt = this._getFormatter();
      this.hoverValueEl.textContent = fmt(val);
      if (isVertical) {
        const yCenter = stripY + stripLength - pct * stripLength;
        if (position === "left") {
          this.hoverValueEl.style.left = `${stripX + stripThickness + arrowSize + 8}px`;
        } else {
          this.hoverValueEl.style.left = `${stripX - arrowSize - 8}px`;
          this.hoverValueEl.style.transform = "translateX(-100%)";
        }
        this.hoverValueEl.style.top = `${yCenter - 9}px`;
      } else {
        const xCenter = stripX + pct * stripLength;
        this.hoverValueEl.style.left = `${xCenter}px`;
        this.hoverValueEl.style.transform = "translateX(-50%)";
        if (position === "top") {
          this.hoverValueEl.style.top = `${stripY + stripThickness + arrowSize + 8}px`;
        } else {
          this.hoverValueEl.style.top = `${stripY - arrowSize - 18}px`;
        }
      }
      this.hoverValueEl.style.opacity = "1";
    }
  }
  /**
   * @param {number} size
   * @param {string} color
   * @param {'top'|'right'|'bottom'|'left'} _position
   */
  _buildArrow(size, color, _position) {
    const polygon = BrowserAPIs.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("fill", color);
    polygon.setAttribute("opacity", "0");
    polygon.setAttribute("class", "apexcharts-heatmap-gradient-arrow");
    polygon.setAttribute("points", "0,0 0,0 0,0");
    polygon.setAttribute("pointer-events", "none");
    return polygon;
  }
  /**
   * Build gradient stops + return effective min/max.
   * - If `colorScale.ranges` is set, stops are placed at each range boundary
   *   so the gradient reflects the user's discrete palette.
   * - Otherwise, samples N stops from the same shadeColor function the cells
   *   use, so the strip visually matches the heatmap.
   * @returns {{ min: number, max: number, stops: Array<{percent:number,color:string}>, bands: Array<{index:number,p1:number,p2:number}> }}
   */
  _computeStops() {
    var _a, _b;
    const w2 = this.w;
    const cs = HeatmapGradientLegend.colorScaleOf(w2) || {};
    const cfg = this._cfg();
    const continuous = buildContinuousScale(w2);
    if (continuous) {
      this._continuous = true;
      return {
        min: continuous.min,
        max: continuous.max,
        stops: continuous.legendStops,
        bands: []
      };
    }
    this._continuous = false;
    let dataMin = Infinity;
    let dataMax = -Infinity;
    const rows = ((_a = w2.seriesData) == null ? void 0 : _a.series) || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      for (let j = 0; j < row.length; j++) {
        const v2 = row[j];
        if (v2 == null || Number.isNaN(v2)) continue;
        if (v2 < dataMin) dataMin = v2;
        if (v2 > dataMax) dataMax = v2;
      }
    }
    if (!Number.isFinite(dataMin)) dataMin = 0;
    if (!Number.isFinite(dataMax)) dataMax = 0;
    let min = dataMin;
    let max = dataMax;
    if (typeof cs.min !== "undefined" && typeof cs.max !== "undefined" && cs.max > cs.min) {
      min = cs.min;
      max = cs.max;
    } else {
      if (typeof cs.min !== "undefined") {
        min = cs.min < dataMin ? cs.min : dataMin;
      }
      if (typeof cs.max !== "undefined") {
        max = cs.max > dataMax ? cs.max : dataMax;
      }
    }
    const stops = [];
    const bands = [];
    if (cs.ranges && cs.ranges.length > 0) {
      const ranges = cs.ranges.map((r, originalIndex) => __spreadProps(__spreadValues({}, r), {
        _originalIndex: originalIndex
      })).sort((a, b2) => a.from - b2.from);
      const lo = ranges[0].from;
      const hi = ranges[ranges.length - 1].to;
      min = lo;
      max = hi;
      const span = hi - lo || 1;
      ranges.forEach((r) => {
        const p1 = (r.from - lo) / span;
        const p2 = (r.to - lo) / span;
        stops.push({ percent: (p1 + p2) / 2, color: r.color });
        bands.push({ index: r._originalIndex, p1, p2 });
      });
    } else {
      const baseColor = w2.globals.colors[0] || "#008FFB";
      const utils = new Utils();
      const plot = w2.config.plotOptions[w2.config.chart.type] || {};
      const shadeIntensity = (_b = plot.shadeIntensity) != null ? _b : 0.5;
      const hasNegs = (
        /** @type {any} */
        w2.globals.hasNegs
      );
      const n = Math.max(2, cfg.stops || 16);
      for (let s = 0; s < n; s++) {
        const t = s / (n - 1);
        const v2 = min + t * (max - min);
        const total = Math.abs(max) + Math.abs(min);
        const percent_v = total === 0 ? 0 : 100 * v2 / total;
        let colorShadePercent;
        if (hasNegs) {
          if (plot.reverseNegativeShade) {
            colorShadePercent = percent_v < 0 ? percent_v / 100 * (shadeIntensity * 1.25) : (1 - percent_v / 100) * (shadeIntensity * 1.25);
          } else {
            colorShadePercent = percent_v <= 0 ? 1 - (1 + percent_v / 100) * shadeIntensity : (1 - percent_v / 100) * shadeIntensity;
          }
        } else {
          colorShadePercent = 1 - percent_v / 100;
        }
        if (colorShadePercent > 1) colorShadePercent = 1;
        if (colorShadePercent < -1) colorShadePercent = -1;
        const shaded = plot.enableShades ? utils.shadeColor(
          w2.config.theme.mode === "dark" ? colorShadePercent * -1 : colorShadePercent,
          baseColor
        ) : baseColor;
        stops.push({ percent: t, color: shaded });
      }
    }
    return { min, max, stops, bands };
  }
}
class Legend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    this.updateSeries = (...a) => ctx.updateHelpers._updateSeries(...a);
    this.onLegendClick = this.onLegendClick.bind(this);
    this.onLegendHovered = this.onLegendHovered.bind(this);
    this.isBarsDistributed = this.w.config.chart.type === "bar" && this.w.config.plotOptions.bar.distributed && this.w.config.series.length === 1;
    this.legendHelpers = new Helpers$3(this);
  }
  init() {
    const w2 = this.w;
    const gl = w2.globals;
    const cnf = w2.config;
    this.isBarsDistributed = cnf.chart.type === "bar" && cnf.plotOptions.bar.distributed && cnf.series.length === 1;
    const showLegendAlways = cnf.legend.showForSingleSeries && this.w.seriesData.series.length === 1 || this.isBarsDistributed || // Heatmap legends are colorScale-driven (discrete ranges or the
    // gradient strip), not series-driven, so they must render even for a
    // single-row heatmap.
    cnf.chart.type === "heatmap" || // Same for a treemap once it has a gradient strip: a nested treemap is
    // usually one series, and the strip describes the colour metric rather
    // than the series.
    HeatmapGradientLegend.isEnabled(w2) || this.w.seriesData.series.length > 1;
    this.legendHelpers.appendToForeignObject();
    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      const elLegendWrap = (
        /** @type {HTMLElement} */
        w2.dom.elLegendWrap
      );
      while (elLegendWrap.firstChild) {
        elLegendWrap.removeChild(elLegendWrap.firstChild);
      }
      if (this.heatmapGradientLegend) {
        this.heatmapGradientLegend.destroy();
        this.heatmapGradientLegend = null;
      }
      if (HeatmapGradientLegend.isEnabled(w2)) {
        this.heatmapGradientLegend = new HeatmapGradientLegend(w2, this.ctx);
        this.heatmapGradientLegend.draw();
      } else {
        this.drawLegends();
        if (cnf.legend.position === "bottom" || cnf.legend.position === "top") {
          this.legendAlignHorizontal();
        } else if (cnf.legend.position === "right" || cnf.legend.position === "left") {
          this.legendAlignVertical();
        }
      }
    }
  }
  createLegendMarker({ i, fillcolor }) {
    const w2 = this.w;
    const elMarker = BrowserAPIs.createElement("span");
    elMarker.classList.add("apexcharts-legend-marker");
    const mShape = w2.config.legend.markers.shape || w2.config.markers.shape;
    let shape = mShape;
    if (Array.isArray(mShape)) {
      shape = mShape[i];
    }
    const mSize = Array.isArray(w2.config.legend.markers.size) ? parseFloat(w2.config.legend.markers.size[i]) : parseFloat(w2.config.legend.markers.size);
    const mOffsetX = Array.isArray(w2.config.legend.markers.offsetX) ? parseFloat(w2.config.legend.markers.offsetX[i]) : parseFloat(w2.config.legend.markers.offsetX);
    const mOffsetY = Array.isArray(w2.config.legend.markers.offsetY) ? parseFloat(w2.config.legend.markers.offsetY[i]) : parseFloat(w2.config.legend.markers.offsetY);
    const mBorderWidth = Array.isArray(w2.config.legend.markers.strokeWidth) ? parseFloat(w2.config.legend.markers.strokeWidth[i]) : parseFloat(w2.config.legend.markers.strokeWidth);
    const mStyle = elMarker.style;
    mStyle.height = (mSize + mBorderWidth) * 2 + "px";
    mStyle.width = (mSize + mBorderWidth) * 2 + "px";
    mStyle.left = mOffsetX + "px";
    mStyle.top = mOffsetY + "px";
    if (w2.config.legend.markers.customHTML) {
      mStyle.background = "transparent";
      mStyle.color = fillcolor[i];
      if (Array.isArray(w2.config.legend.markers.customHTML)) {
        if (w2.config.legend.markers.customHTML[i]) {
          elMarker.innerHTML = w2.config.legend.markers.customHTML[i]();
        }
      } else {
        elMarker.innerHTML = w2.config.legend.markers.customHTML();
      }
    } else {
      const markers = new Markers(this.ctx.w, this.ctx);
      const markerConfig = markers.getMarkerConfig({
        cssClass: `apexcharts-legend-marker apexcharts-marker apexcharts-marker-${shape}`,
        seriesIndex: i,
        strokeWidth: mBorderWidth,
        size: mSize
      });
      const SVGLib = Environment.isBrowser() ? (
        /** @type {any} */
        window.SVG
      ) : (
        /** @type {any} */
        global.SVG
      );
      const SVGMarker = SVGLib().addTo(elMarker).size("100%", "100%");
      const marker = new Graphics(this.w).drawMarker(0, 0, __spreadProps(__spreadValues({}, markerConfig), {
        pointFillColor: Array.isArray(fillcolor) ? fillcolor[i] : markerConfig.pointFillColor,
        shape
      }));
      const shapesEls = w2.dom.Paper.find(
        ".apexcharts-legend-marker.apexcharts-marker"
      );
      shapesEls.forEach((shapeEl) => {
        if (shapeEl.node.classList.contains("apexcharts-marker-triangle")) {
          shapeEl.node.style.transform = "translate(50%, 45%)";
        } else {
          shapeEl.node.style.transform = "translate(50%, 50%)";
        }
      });
      SVGMarker.add(marker);
    }
    return elMarker;
  }
  drawLegends() {
    var _a;
    const me = this;
    const w2 = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w2.dom.elLegendWrap
    );
    const fontFamily = w2.config.legend.fontFamily;
    let legendNames = w2.seriesData.seriesNames;
    let fillcolor = w2.config.legend.markers.fillColors ? w2.config.legend.markers.fillColors.slice() : w2.globals.colors.slice();
    if (w2.config.chart.type === "heatmap") {
      const ranges = w2.config.plotOptions.heatmap.colorScale.ranges;
      legendNames = ranges.map((colorScale) => {
        return colorScale.name ? colorScale.name : colorScale.from + " - " + colorScale.to;
      });
      fillcolor = ranges.map((color) => color.color);
    } else if (this.isBarsDistributed) {
      legendNames = w2.labelData.labels.slice();
    }
    if (w2.config.legend.customLegendItems.length) {
      legendNames = w2.config.legend.customLegendItems;
    }
    const legendFormatter = w2.formatters.legendFormatter;
    const isLegendInversed = w2.config.legend.inverseOrder;
    const legendGroups = [];
    if (w2.labelData.seriesGroups.length > 1 && w2.config.legend.clusterGroupedSeries) {
      w2.labelData.seriesGroups.forEach((_, gi) => {
        legendGroups[gi] = BrowserAPIs.createElement("div");
        legendGroups[gi].classList.add(
          "apexcharts-legend-group",
          `apexcharts-legend-group-${gi}`
        );
        if (w2.config.legend.clusterGroupedSeriesOrientation === "horizontal") {
          elLegendWrap.classList.add("apexcharts-legend-group-horizontal");
        } else {
          legendGroups[gi].classList.add("apexcharts-legend-group-vertical");
        }
      });
    }
    for (let i = isLegendInversed ? legendNames.length - 1 : 0; isLegendInversed ? i >= 0 : i <= legendNames.length - 1; isLegendInversed ? i-- : i++) {
      const text = legendFormatter(legendNames[i], { seriesIndex: i, w: w2 });
      let collapsedSeries = false;
      let ancillaryCollapsedSeries = false;
      if (w2.globals.collapsedSeries.length > 0) {
        for (let c = 0; c < w2.globals.collapsedSeries.length; c++) {
          if (w2.globals.collapsedSeries[c].index === i) {
            collapsedSeries = true;
          }
        }
      }
      if (w2.globals.ancillaryCollapsedSeriesIndices.length > 0) {
        for (let c = 0; c < w2.globals.ancillaryCollapsedSeriesIndices.length; c++) {
          if (w2.globals.ancillaryCollapsedSeriesIndices[c] === i) {
            ancillaryCollapsedSeries = true;
          }
        }
      }
      const elMarker = this.createLegendMarker({ i, fillcolor });
      Graphics.setAttrs(elMarker, {
        rel: i + 1,
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elMarker.classList.add("apexcharts-inactive-legend");
      }
      const elLegend = BrowserAPIs.createElement("div");
      if (w2.config.chart.accessibility.enabled && w2.config.chart.accessibility.keyboard.enabled) {
        elLegend.setAttribute("role", "button");
        elLegend.setAttribute("tabindex", "0");
        const seriesName = Array.isArray(text) ? text.join(" ") : text;
        const isCollapsed = collapsedSeries || ancillaryCollapsedSeries;
        const statusText = isCollapsed ? "hidden" : "visible";
        elLegend.setAttribute(
          "aria-label",
          `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
        );
        elLegend.setAttribute("aria-pressed", isCollapsed ? "true" : "false");
      }
      const elLegendText = BrowserAPIs.createElement("span");
      elLegendText.classList.add("apexcharts-legend-text");
      elLegendText.innerHTML = Array.isArray(text) ? text.join(" ") : text;
      let textColor = w2.config.legend.labels.useSeriesColors ? w2.globals.colors[i] : Array.isArray(w2.config.legend.labels.colors) ? (_a = w2.config.legend.labels.colors) == null ? void 0 : _a[i] : w2.config.legend.labels.colors;
      if (!textColor) {
        textColor = w2.config.chart.foreColor;
      }
      elLegendText.style.color = textColor;
      elLegendText.style.fontSize = w2.config.legend.fontSize;
      elLegendText.style.fontWeight = w2.config.legend.fontWeight;
      elLegendText.style.fontFamily = fontFamily || w2.config.chart.fontFamily;
      Graphics.setAttrs(elLegendText, {
        rel: i + 1,
        i,
        "data:default-text": encodeURIComponent(text),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      elLegend.appendChild(elMarker);
      elLegend.appendChild(elLegendText);
      const coreUtils = new CoreUtils(this.w);
      if (!w2.config.legend.showForZeroSeries) {
        const total = coreUtils.getSeriesTotalByIndex(i);
        if (total === 0 && coreUtils.seriesHaveSameValues(i) && !coreUtils.isSeriesNull(i) && w2.globals.collapsedSeriesIndices.indexOf(i) === -1 && w2.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1) {
          elLegend.classList.add("apexcharts-hidden-zero-series");
        }
      }
      if (!w2.config.legend.showForNullSeries) {
        if (coreUtils.isSeriesNull(i) && w2.globals.collapsedSeriesIndices.indexOf(i) === -1 && w2.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1) {
          elLegend.classList.add("apexcharts-hidden-null-series");
        }
      }
      if (legendGroups.length) {
        w2.labelData.seriesGroups.forEach((group, gi) => {
          var _a2, _b;
          if (group.includes(
            /** @type {Record<string,any>} */
            (_b = (_a2 = w2.config.series[i]) == null ? void 0 : _a2.name) != null ? _b : ""
          )) {
            elLegendWrap.appendChild(legendGroups[gi]);
            legendGroups[gi].appendChild(elLegend);
          }
        });
      } else {
        elLegendWrap.appendChild(elLegend);
      }
      elLegendWrap.classList.add(
        `apexcharts-align-${w2.config.legend.horizontalAlign}`
      );
      elLegendWrap.classList.add(
        "apx-legend-position-" + w2.config.legend.position
      );
      elLegend.classList.add("apexcharts-legend-series");
      elLegend.style.margin = `${w2.config.legend.itemMargin.vertical}px ${w2.config.legend.itemMargin.horizontal}px`;
      elLegendWrap.style.width = w2.config.legend.width ? w2.config.legend.width + "px" : "";
      elLegendWrap.style.height = w2.config.legend.height ? w2.config.legend.height + "px" : "";
      Graphics.setAttrs(elLegend, {
        rel: i + 1,
        seriesName: Utils.escapeString(legendNames[i]),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elLegend.classList.add("apexcharts-inactive-legend");
      }
      if (!w2.config.legend.onItemClick.toggleDataSeries) {
        elLegend.classList.add("apexcharts-no-click");
      }
    }
    w2.dom.elWrap.addEventListener("click", me.onLegendClick, true);
    if (w2.config.legend.onItemHover.highlightDataSeries && w2.config.legend.customLegendItems.length === 0) {
      w2.dom.elWrap.addEventListener("mousemove", me.onLegendHovered, true);
      w2.dom.elWrap.addEventListener("mouseout", me.onLegendHovered, true);
    }
    if (w2.config.chart.accessibility.enabled && w2.config.chart.accessibility.keyboard.enabled) {
      w2.dom.elWrap.addEventListener(
        "keydown",
        me.onLegendKeyDown.bind(me),
        true
      );
    }
  }
  /**
   * @param {number} offsetX
   * @param {number} offsetY
   */
  setLegendWrapXY(offsetX, offsetY) {
    const w2 = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w2.dom.elLegendWrap
    );
    const legendHeight = elLegendWrap.clientHeight;
    let x = 0;
    let y = 0;
    if (w2.config.legend.position === "bottom") {
      y = w2.globals.svgHeight - Math.min(legendHeight, w2.globals.svgHeight / 2) - 5;
    } else if (w2.config.legend.position === "top") {
      const dim = new Dimensions(this.w, this.ctx);
      const titleH = dim.dimHelpers.getTitleSubtitleCoords("title").height;
      const subtitleH = dim.dimHelpers.getTitleSubtitleCoords("subtitle").height;
      y = (titleH > 0 ? titleH - 10 : 0) + (subtitleH > 0 ? subtitleH - 10 : 0);
    }
    elLegendWrap.style.position = "absolute";
    x = x + offsetX + w2.config.legend.offsetX;
    y = y + offsetY + w2.config.legend.offsetY;
    elLegendWrap.style.left = x + "px";
    elLegendWrap.style.top = y + "px";
    if (w2.config.legend.position === "right") {
      elLegendWrap.style.left = "auto";
      elLegendWrap.style.right = 25 + w2.config.legend.offsetX + "px";
    }
    const fixedHeigthWidth = (
      /** @type {const} */
      ["width", "height"]
    );
    fixedHeigthWidth.forEach((hw) => {
      if (elLegendWrap && elLegendWrap.style[hw]) {
        elLegendWrap.style[hw] = parseInt(String(w2.config.legend[hw]), 10) + "px";
      }
    });
  }
  legendAlignHorizontal() {
    const w2 = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w2.dom.elLegendWrap
    );
    elLegendWrap.style.right = "0";
    const dimensions = new Dimensions(this.w, this.ctx);
    const titleRect = dimensions.dimHelpers.getTitleSubtitleCoords("title");
    const subtitleRect = dimensions.dimHelpers.getTitleSubtitleCoords("subtitle");
    const offsetX = 20;
    let offsetY = 0;
    if (w2.config.legend.position === "top") {
      offsetY = titleRect.height + subtitleRect.height + w2.config.title.margin + w2.config.subtitle.margin - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  legendAlignVertical() {
    const w2 = this.w;
    const lRect = this.legendHelpers.getLegendDimensions();
    const offsetY = 20;
    let offsetX = 0;
    if (w2.config.legend.position === "left") {
      offsetX = 20;
    }
    if (w2.config.legend.position === "right") {
      offsetX = w2.globals.svgWidth - lRect.clww - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  /**
   * @param {MouseEvent} e
   */
  onLegendHovered(e) {
    var _a;
    const w2 = this.w;
    const target = (
      /** @type {Element} */
      e.target
    );
    const hoverOverLegend = target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker");
    if (w2.config.chart.type !== "heatmap" && !this.isBarsDistributed) {
      if (!target.classList.contains("apexcharts-inactive-legend") && hoverOverLegend) {
        const series = new Series(this.ctx.w);
        series.toggleSeriesOnHover(e, target);
      }
    } else {
      if (hoverOverLegend) {
        const seriesCnt = parseInt((_a = target.getAttribute("rel")) != null ? _a : "0", 10) - 1;
        this.ctx.events.fireEvent("legendHover", [this.ctx, seriesCnt, this.w]);
        const series = new Series(this.ctx.w);
        if (e.type === "mousemove") {
          series.highlightRangeInSeries(seriesCnt, "highlight");
        } else if (e.type === "mouseout") {
          series.highlightRangeInSeries(seriesCnt, "reset");
        }
      }
    }
  }
  /**
   * @param {KeyboardEvent} e
   */
  onLegendKeyDown(e) {
    const me = this;
    const w2 = this.w;
    const target = (
      /** @type {Element} */
      e.target
    );
    const isLegendItem = target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker");
    if (!isLegendItem) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rel = target.getAttribute("rel");
      me.onLegendClick(e);
      if (rel !== null && w2.config.legend.onItemClick.toggleDataSeries) {
        requestAnimationFrame(() => {
          const restored = w2.dom.baseEl.querySelector(
            `.apexcharts-legend-series[rel="${rel}"]`
          );
          if (restored) restored.focus();
        });
      }
    }
  }
  /**
   * @param {Event} e
   */
  onLegendClick(e) {
    var _a;
    const w2 = this.w;
    const target = (
      /** @type {Element} */
      e.target
    );
    if (w2.config.legend.customLegendItems.length) return;
    if (target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker")) {
      const seriesCnt = parseInt((_a = target.getAttribute("rel")) != null ? _a : "0", 10) - 1;
      const isHidden = target.getAttribute("data:collapsed") === "true";
      const legendClick = this.w.config.chart.events.legendClick;
      if (typeof legendClick === "function") {
        legendClick(this.ctx, seriesCnt, this.w);
      }
      this.ctx.events.fireEvent("legendClick", [this.ctx, seriesCnt, this.w]);
      const markerClick = this.w.config.legend.markers.onClick;
      if (typeof markerClick === "function" && target.classList.contains("apexcharts-legend-marker")) {
        markerClick(this.ctx, seriesCnt, this.w);
        this.ctx.events.fireEvent("legendMarkerClick", [
          this.ctx,
          seriesCnt,
          this.w
        ]);
      }
      const clickAllowed = w2.config.chart.type !== "treemap" && w2.config.chart.type !== "heatmap" && !this.isBarsDistributed;
      if (clickAllowed && w2.config.legend.onItemClick.toggleDataSeries) {
        this.legendHelpers.toggleDataSeries(seriesCnt, isHidden);
      }
    }
  }
}
_core__default.registerFeatures({ legend: Legend });
const icoPan = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M5 9 2 12l3 3"/>\n    <path d="M9 5l3-3 3 3"/>\n    <path d="M15 19l-3 3-3-3"/>\n    <path d="M19 9l3 3-3 3"/>\n    <path d="M2 12h20"/>\n    <path d="M12 2v20"/>\n</svg>\n';
const icoZoom = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <circle cx="11" cy="11" r="7"/>\n    <path d="m21 21-4.3-4.3M8 11h6M11 8v6"/>\n</svg>\n';
const icoReset = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>\n    <path d="M3 3v5h5"/>\n</svg>\n';
const icoZoomIn = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M12 5v14M5 12h14"/>\n</svg>\n';
const icoZoomOut = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M5 12h14"/>\n</svg>\n';
const icoSelect = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M5 3a2 2 0 0 0-2 2"/>\n    <path d="M19 3a2 2 0 0 1 2 2"/>\n    <path d="M21 19a2 2 0 0 1-2 2"/>\n    <path d="M5 21a2 2 0 0 1-2-2"/>\n    <path d="M9 3h1M14 3h1M9 21h1M14 21h1M3 9v1M3 14v1M21 9v1M21 14v1"/>\n</svg>\n';
const icoMeasure = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/>\n    <path d="m14.5 12.5 2-2"/>\n    <path d="m11.5 9.5 2-2"/>\n    <path d="m8.5 6.5 2-2"/>\n    <path d="m17.5 15.5 2-2"/>\n</svg>\n';
const icoMenu = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M4 6h16M4 12h16M4 18h16"/>\n</svg>\n';
class Toolbar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    this.ev = this.w.config.chart.events;
    this.selectedClass = "apexcharts-selected";
    this.localeValues = this.w.globals.locale.toolbar;
    this.minX = w2.globals.minX;
    this.maxX = w2.globals.maxX;
    this.elZoom = null;
    this.elZoomIn = null;
    this.elZoomOut = null;
    this.elPan = null;
    this.elSelection = null;
    this.elMeasure = null;
    this.elZoomReset = null;
    this.elMenuIcon = null;
    this.elMenu = null;
    this.elMenuItems = [];
    this.t = null;
  }
  createToolbar() {
    var _a, _b;
    const w2 = this.w;
    const createDiv = () => {
      return BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "div");
    };
    const createBtn = () => {
      const btn = (
        /** @type {HTMLButtonElement} */
        BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "button")
      );
      btn.setAttribute("type", "button");
      return btn;
    };
    const elToolbarWrap = createDiv();
    elToolbarWrap.setAttribute("class", "apexcharts-toolbar");
    elToolbarWrap.style.top = w2.config.chart.toolbar.offsetY + "px";
    elToolbarWrap.style.right = -w2.config.chart.toolbar.offsetX + 3 + "px";
    w2.dom.elWrap.appendChild(elToolbarWrap);
    this.elZoom = createBtn();
    this.elZoomIn = createBtn();
    this.elZoomOut = createBtn();
    this.elPan = createBtn();
    this.elSelection = createBtn();
    this.elMeasure = createBtn();
    this.elZoomReset = createBtn();
    this.elMenuIcon = createBtn();
    this.elMenu = createDiv();
    this.elCustomIcons = [];
    this.t = w2.config.chart.toolbar.tools;
    if (Array.isArray(this.t.customIcons)) {
      for (let i = 0; i < this.t.customIcons.length; i++) {
        this.elCustomIcons.push(createBtn());
      }
    }
    const toolbarControls = [];
    const appendZoomControl = (type, el, ico) => {
      const tool = type.toLowerCase();
      if (this.t[tool] && w2.config.chart.zoom.enabled) {
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
      if (this.t[z] && w2.config.chart[z].enabled) {
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
    if (this.t.pan && w2.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elPan,
        icon: typeof this.t.pan === "string" ? this.t.pan : icoPan,
        title: this.localeValues.pan,
        class: "apexcharts-pan-icon"
      });
    }
    if (this.t.measure && w2.config.chart.measure && w2.config.chart.measure.enabled) {
      toolbarControls.push({
        el: this.elMeasure,
        icon: typeof this.t.measure === "string" ? this.t.measure : icoMeasure,
        title: (
          /** @type {any} */
          this.localeValues.measure || "Measure"
        ),
        class: "apexcharts-measure-icon"
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
        "aria-label": toolbarControls[i].title
      });
      toolbarControls[i].el.innerHTML = toolbarControls[i].icon;
      elToolbarWrap.appendChild(toolbarControls[i].el);
    }
    if (this.elZoom.parentNode) {
      this.elZoom.setAttribute("aria-pressed", String(!!w2.interact.zoomEnabled));
    }
    if (this.elSelection.parentNode) {
      this.elSelection.setAttribute(
        "aria-pressed",
        String(!!w2.interact.selectionEnabled)
      );
    }
    if (this.elPan.parentNode) {
      this.elPan.setAttribute("aria-pressed", String(!!w2.interact.panEnabled));
    }
    if (this.elMeasure.parentNode) {
      this.elMeasure.setAttribute(
        "aria-pressed",
        String(!!w2.interact.measureEnabled)
      );
    }
    if (this.elMenuIcon.parentNode) {
      this.elMenuIcon.setAttribute("aria-haspopup", "true");
      this.elMenuIcon.setAttribute("aria-expanded", "false");
    }
    this._createHamburgerMenu(elToolbarWrap);
    if (w2.interact.zoomEnabled) {
      this.elZoom.classList.add(this.selectedClass);
    } else if (w2.interact.panEnabled) {
      this.elPan.classList.add(this.selectedClass);
    } else if (w2.interact.selectionEnabled) {
      this.elSelection.classList.add(this.selectedClass);
    } else if (w2.interact.measureEnabled && this.elMeasure) {
      this.elMeasure.classList.add(this.selectedClass);
      (_b = (_a = this.ctx.measure) == null ? void 0 : _a.startMeasure) == null ? void 0 : _b.call(_a);
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
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
    (_g = this.elMeasure) == null ? void 0 : _g.addEventListener("click", this.toggleMeasure.bind(this));
    (_h = this.elMenuIcon) == null ? void 0 : _h.addEventListener("click", this.toggleMenu.bind(this));
    this.elMenuItems.forEach((m2) => {
      if (m2.classList.contains("exportSVG")) {
        m2.addEventListener("click", this.handleDownload.bind(this, "svg"));
      } else if (m2.classList.contains("exportPNG")) {
        m2.addEventListener("click", this.handleDownload.bind(this, "png"));
      } else if (m2.classList.contains("exportCSV")) {
        m2.addEventListener("click", this.handleDownload.bind(this, "csv"));
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
      this.elMeasure,
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
    (_i = this.elMenuIcon) == null ? void 0 : _i.addEventListener(
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
    this.elMenuItems.forEach((m2, idx) => {
      m2.addEventListener("keydown", (e) => {
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
          m2.click();
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
      const tb = ch.ctx.toolbar;
      const enabledType = type === "selection" ? "selectionEnabled" : "zoomEnabled";
      const wasEnabled = !!ch.w.globals[enabledType];
      tb.toggleOtherControls();
      const el = type === "selection" ? tb.elSelection : tb.elZoom;
      if (!wasEnabled) {
        ch.w.globals[enabledType] = true;
        el.classList.add(tb.selectedClass);
      }
      el.setAttribute("aria-pressed", String(!!ch.w.globals[enabledType]));
    });
  }
  /**
   * Toggle the measure ruler tool. Mutually exclusive with zoom/pan/selection
   * (toggleOtherControls deselects those and disarms any active measure), so a
   * fresh enable arms the ruler via the Measure module's sticky mode.
   */
  toggleMeasure() {
    var _a, _b, _c, _d;
    const w2 = this.w;
    const enabling = !w2.interact.measureEnabled;
    this.toggleOtherControls();
    if (enabling) {
      w2.interact.measureEnabled = true;
      (_a = this.elMeasure) == null ? void 0 : _a.classList.add(this.selectedClass);
      (_c = (_b = this.ctx.measure) == null ? void 0 : _b.startMeasure) == null ? void 0 : _c.call(_b);
    }
    (_d = this.elMeasure) == null ? void 0 : _d.setAttribute(
      "aria-pressed",
      String(w2.interact.measureEnabled)
    );
  }
  getToolbarIconsReference() {
    const w2 = this.w;
    if (!this.elZoom) {
      this.elZoom = w2.dom.baseEl.querySelector(".apexcharts-zoom-icon");
    }
    if (!this.elPan) {
      this.elPan = w2.dom.baseEl.querySelector(".apexcharts-pan-icon");
    }
    if (!this.elSelection) {
      this.elSelection = w2.dom.baseEl.querySelector(
        ".apexcharts-selection-icon"
      );
    }
    if (!this.elMeasure) {
      this.elMeasure = w2.dom.baseEl.querySelector(".apexcharts-measure-icon");
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
      const tb = ch.ctx.toolbar;
      const wasEnabled = !!ch.w.interact.panEnabled;
      tb.toggleOtherControls();
      if (!wasEnabled) {
        ch.w.interact.panEnabled = true;
        tb.elPan.classList.add(tb.selectedClass);
      }
      tb.elPan.setAttribute("aria-pressed", String(!!ch.w.interact.panEnabled));
    });
  }
  toggleOtherControls() {
    var _a, _b, _c;
    const w2 = this.w;
    w2.interact.panEnabled = false;
    w2.interact.zoomEnabled = false;
    w2.interact.selectionEnabled = false;
    if (w2.interact.measureEnabled) {
      w2.interact.measureEnabled = false;
      (_b = (_a = this.ctx.measure) == null ? void 0 : _a.stopMeasure) == null ? void 0 : _b.call(_a);
      (_c = this.elMeasure) == null ? void 0 : _c.setAttribute("aria-pressed", "false");
    }
    this.getToolbarIconsReference();
    const toggleEls = [this.elPan, this.elSelection, this.elZoom, this.elMeasure];
    toggleEls.forEach((el) => {
      if (el) {
        el.classList.remove(this.selectedClass);
      }
    });
  }
  /**
   * Read the current x-range from globals at click time.
   * Toolbar instance is kept alive across updates (Phase 8 lazy
   * instantiation), so cached this.minX/maxX go stale after a zoom.
   * @returns {{minX: number, maxX: number}}
   */
  _currentXRange() {
    const w2 = this.w;
    if (w2.axisFlags.isRangeBar) {
      return { minX: w2.globals.minY, maxX: w2.globals.maxY };
    }
    return { minX: w2.globals.minX, maxX: w2.globals.maxX };
  }
  handleZoomIn() {
    const w2 = this.w;
    const { minX, maxX } = this._currentXRange();
    this.minX = minX;
    this.maxX = maxX;
    const centerX = (minX + maxX) / 2;
    const newMinX = (minX + centerX) / 2;
    const newMaxX = (maxX + centerX) / 2;
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w2.interact.disableZoomIn) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  handleZoomOut() {
    const w2 = this.w;
    const { minX, maxX } = this._currentXRange();
    this.minX = minX;
    this.maxX = maxX;
    if (w2.config.xaxis.type === "datetime" && new Date(minX).getUTCFullYear() < 1e3) {
      return;
    }
    const centerX = (minX + maxX) / 2;
    const newMinX = minX - (centerX - minX);
    const newMaxX = maxX - (centerX - maxX);
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w2.interact.disableZoomOut) {
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
    const w2 = this.w;
    if (newMinX === void 0 && newMaxX === void 0) {
      this.handleZoomReset();
      return;
    }
    if (w2.config.xaxis.convertedCatToNumeric) {
      if (newMinX < 1) {
        newMinX = 1;
        newMaxX = w2.globals.dataPoints;
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
    if (!w2.globals.initialConfig) return;
    const yaxis = Utils.clone(w2.globals.initialConfig.yaxis);
    if (!w2.config.chart.group) {
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
    const w2 = this.w;
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
          series: w2.config.series,
          columnDelimiter: w2.config.chart.toolbar.export.csv.columnDelimiter
        });
        break;
    }
  }
  handleZoomReset() {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      const w2 = ch.w;
      if (!w2.interact.zoomed) return;
      w2.globals.lastXAxis.min = w2.globals.initialConfig.xaxis.min;
      w2.globals.lastXAxis.max = w2.globals.initialConfig.xaxis.max;
      ch.updateHelpers.revertDefaultAxisMinMax();
      if (typeof w2.config.chart.events.beforeResetZoom === "function") {
        const resetZoomRange = w2.config.chart.events.beforeResetZoom(ch, w2);
        if (resetZoomRange) {
          ch.updateHelpers.revertDefaultAxisMinMax(resetZoomRange);
        }
      }
      if (typeof w2.config.chart.events.zoomed === "function") {
        ch.ctx.toolbar.zoomCallback({
          min: w2.config.xaxis.min,
          max: w2.config.xaxis.max
        });
      }
      const series = ch.ctx.series.emptyCollapsedSeries(
        Utils.clone(w2.globals.initialSeries)
      );
      ch.updateHelpers._updateSeries(
        series,
        w2.config.chart.animations.dynamicAnimation.enabled
      );
      w2.interact.zoomed = false;
    });
  }
  destroy() {
    this.elZoom = null;
    this.elZoomIn = null;
    this.elZoomOut = null;
    this.elPan = null;
    this.elSelection = null;
    this.elMeasure = null;
    this.elZoomReset = null;
    this.elMenuIcon = null;
  }
}
class AxisMapping {
  /**
   * Pixels per data-unit on the x-axis. Derived from `minX..maxX` so it is the
   * exact inverse used by both {@link dataXToPx} and {@link pxToDataX}.
   * @param {import('../types/internal').ChartStateW} w
   * @returns {number}
   */
  static xRatio(w2) {
    const gw = w2.layout.gridWidth || 1;
    return (w2.globals.maxX - w2.globals.minX) / gw;
  }
  /**
   * Data-x -> pixels from the plot origin (usable as an SVG `x` attribute).
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} dataX
   * @returns {number}
   */
  static dataXToPx(w2, dataX) {
    return (dataX - w2.globals.minX) / AxisMapping.xRatio(w2);
  }
  /**
   * Pixels from the plot origin -> data-x. Feed it `screenX - svgLeft - translateX`.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} px
   * @returns {number}
   */
  static pxToDataX(w2, px) {
    return w2.globals.minX + px * AxisMapping.xRatio(w2);
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
  static screenXToPlotPx(w2, screenX) {
    const baseEl = w2.dom.baseEl;
    const svg = baseEl && baseEl.querySelector(".apexcharts-svg");
    if (!svg) return screenX - w2.layout.translateX;
    const svgRect = svg.getBoundingClientRect();
    const zoom = w2.globals.svgWidth ? svgRect.width / w2.globals.svgWidth : 1;
    return (screenX - svgRect.left) / (zoom || 1) - w2.layout.translateX;
  }
}
const WHEEL_ZOOM_PIXELS_PER_2X = 240;
const INERTIA_MIN_RELEASE_VELOCITY = 0.05;
const INERTIA_DEFAULT_FRICTION = 0.92;
const INERTIA_STOP_VELOCITY = 0.02;
const FRAME_MS_60FPS = 16.6667;
const PAN_NUDGE_DIVISOR = 15;
class ZoomPanSelection extends Toolbar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    super(w2, ctx);
    this.w = w2;
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
      "touchend"
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
  }
  /** @param {{xyRatios: any}} opts */
  init({ xyRatios }) {
    const w2 = this.w;
    const me = this;
    this.xyRatios = xyRatios;
    this.zoomRect = this.graphics.drawRect(0, 0, 0, 0);
    this.selectionRect = this.graphics.drawRect(0, 0, 0, 0);
    this.constraints = new Box$1(0, 0, w2.layout.gridWidth, w2.layout.gridHeight);
    this.zoomRect.node.classList.add("apexcharts-zoom-rect");
    this.selectionRect.node.classList.add("apexcharts-selection-rect");
    w2.dom.Paper.add(this.zoomRect);
    w2.dom.Paper.add(this.selectionRect);
    if (w2.config.chart.selection.type === "x") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        minY: 0,
        maxX: w2.layout.gridWidth,
        maxY: w2.layout.gridHeight
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else if (w2.config.chart.selection.type === "y") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        maxX: w2.layout.gridWidth
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else {
      this.slDraggableRect = this.selectionRect.draggable().on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    }
    this.preselectedSelection();
    this.hoverArea = /** @type {Element} */
    w2.dom.baseEl.querySelector(`${w2.globals.chartClass} .apexcharts-svg`);
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
    if (this._wheelZoomEnabled()) {
      this.hoverArea.addEventListener("wheel", me.mouseWheelEvent.bind(me), {
        capture: false,
        passive: false
      });
    }
    if (this._momentumEnabled()) {
      ["touchstart", "touchmove", "touchend", "touchcancel"].forEach(
        (event) => {
          var _a;
          (_a = this.hoverArea) == null ? void 0 : _a.addEventListener(event, me.momentumTouch.bind(me), {
            capture: false,
            passive: false
          });
        }
      );
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
  }
  /**
   * @param {import('../types/internal').XYRatios} xyRatios
   * @param {any} e
   */
  svgMouseEvents(xyRatios, e) {
    const w2 = this.w;
    const toolbar = this.ctx.toolbar;
    if (w2.interact.momentum && w2.interact.momentum.busy) return;
    if (this._momentumEnabled() && e.touches && e.touches.length > 1) {
      return;
    }
    const zoomtype = w2.interact.zoomEnabled ? w2.config.chart.zoom.type : w2.config.chart.selection.type;
    const autoSelected = w2.config.chart.toolbar.autoSelected;
    if (autoSelected !== "measure") {
      if (e.shiftKey) {
        w2.interact.shiftWasPressed = true;
        toolbar.enableZoomPanFromToolbar(autoSelected === "pan" ? "zoom" : "pan");
      } else {
        if (w2.interact.shiftWasPressed) {
          toolbar.enableZoomPanFromToolbar(autoSelected);
          w2.interact.shiftWasPressed = false;
        }
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
      const gridRectDim = this._gridRect();
      if (!gridRectDim) return;
      this.startX = this._screenXToPlotPx(this.clientX);
      this.startY = this.clientY - gridRectDim.top;
      this.dragged = false;
      this.w.interact.mousedown = true;
    }
    if (e.type === "mousemove" && e.which === 1 || e.type === "touchmove") {
      this.dragged = true;
      if (w2.interact.panEnabled) {
        w2.interact.selection = null;
        if (this.w.interact.mousedown) {
          this.panDragging({
            context: this,
            zoomtype,
            xyRatios: this.xyRatios
          });
        }
      } else {
        if (this.w.interact.mousedown && w2.interact.zoomEnabled || this.w.interact.mousedown && w2.interact.selectionEnabled) {
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
    const w2 = this.w;
    const gridRectDim = this._gridRect();
    if (gridRectDim && (this.w.interact.mousedown || isResized)) {
      this.endX = this._screenXToPlotPx(this.clientX);
      this.endY = this.clientY - gridRectDim.top;
      this.dragX = Math.abs(this.endX - this.startX);
      this.dragY = Math.abs(this.endY - this.startY);
      if (w2.interact.zoomEnabled || w2.interact.selectionEnabled) {
        this.selectionDrawn({
          context: this,
          zoomtype
        });
      }
    }
    if (w2.interact.zoomEnabled) {
      this.hideSelectionRect(this.selectionRect);
    }
    this.dragged = false;
    this.w.interact.mousedown = false;
  }
  // ---------------------------------------------------------------------------
  // Wheel zoom: continuous, cursor-anchored zoom on mouse wheel / trackpad.
  //
  // Each wheel event multiplies a pending zoom factor scaled to its deltaY (so
  // a trackpad's stream of tiny deltas and a discrete wheel's ±100 notches both
  // feel proportional), and the accumulated factor is applied at most once per
  // animation frame through the same immediate, animation-free fast path the
  // touch pinch uses (_applyXRange). Deliberately instant, trading-chart style:
  // no per-step morph and no easing between steps (an animated variant was
  // tried and rejected). The original implementation instead ran a fixed
  // 0.5x/1.5x animated update at most once per 400ms and dropped every wheel
  // event in between, which read as lag on continuous scrolling.
  //
  // Like Momentum (see the comment above momentumTouch), applying a frame
  // triggers _updateOptions, which destroys and recreates this instance
  // mid-gesture, so all wheel-gesture state lives on w.interact.wheel rather
  // than on the instance.
  // ---------------------------------------------------------------------------
  /**
   * A wheel or pinch zoom is an incidental gesture: the viewer can land in a
   * zoomed window without meaning to (a page scroll over the chart, a two-finger
   * swipe), so it is only offered when there is a way back out of it. The only
   * built-in way back is the toolbar's reset button, hence 'auto' (the default
   * for both allowMouseWheelZoom and pinch) resolves against that button being
   * present. A page that builds its own reset control sets the option to true
   * and gets the gesture with no toolbar. Drag-to-zoom is deliberate, so it is
   * not gated this way.
   *
   * @param {boolean|'auto'} setting
   */
  _incidentalZoomEnabled(setting) {
    var _a, _b, _c;
    const c = this.w.config.chart;
    if (!c.zoom || !c.zoom.enabled) return false;
    if (setting !== "auto") return !!setting;
    return !!(((_a = c.toolbar) == null ? void 0 : _a.show) && ((_c = (_b = c.toolbar) == null ? void 0 : _b.tools) == null ? void 0 : _c.reset));
  }
  _wheelZoomEnabled() {
    const { zoom } = this.w.config.chart;
    return this._incidentalZoomEnabled(zoom && zoom.allowMouseWheelZoom);
  }
  /** Lazily-created, re-render-surviving wheel-gesture state. */
  _wheel() {
    const it = this.w.interact;
    if (!it.wheel) {
      it.wheel = {
        factor: 1,
        clientX: 0,
        /** @type {number|null} */
        rafId: null,
        /** @type {any} */
        endTimer: null
      };
    }
    return it.wheel;
  }
  /**
   * @param {any} e
   */
  mouseWheelEvent(e) {
    e.preventDefault();
    const st = this._wheel();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 33;
    else if (e.deltaMode === 2) dy *= 330;
    st.factor *= Math.pow(2, dy / WHEEL_ZOOM_PIXELS_PER_2X);
    st.clientX = e.clientX;
    if (st.rafId == null) {
      st.rafId = requestAnimationFrame(() => this._applyWheelZoom());
    }
    if (st.endTimer) clearTimeout(st.endTimer);
    st.endTimer = setTimeout(() => this._endWheelZoom(), 150);
  }
  /**
   * Apply the zoom factor accumulated since the last animation frame, keeping
   * the data value under the cursor pinned (both zooming in and out).
   */
  _applyWheelZoom() {
    const w2 = this.w;
    const st = this._wheel();
    st.rafId = null;
    const scale = st.factor;
    st.factor = 1;
    if (scale === 1 || w2.globals.isDestroyed) return;
    const gridRectDim = this._gridRect();
    if (!gridRectDim || !gridRectDim.width) return;
    const { min, max } = this._currentXWindow();
    const range = max - min;
    const mouseX = Math.min(
      Math.max((st.clientX - gridRectDim.left) / gridRectDim.width, 0),
      1
    );
    let newRange = range * scale;
    const bounds = this._clampBounds();
    if (bounds) {
      const minXDiff = w2.globals.minXDiff > 0 && isFinite(w2.globals.minXDiff) ? w2.globals.minXDiff : 0;
      const minRange = Math.max(minXDiff * 2, (bounds.max - bounds.min) * 1e-6);
      if (newRange < minRange) newRange = minRange;
      if (newRange > bounds.max - bounds.min) newRange = bounds.max - bounds.min;
    }
    const anchor = min + mouseX * range;
    let newMinX = anchor - mouseX * newRange;
    let newMaxX = newMinX + newRange;
    const eps = range * 1e-9;
    if (Math.abs(newMinX - min) < eps && Math.abs(newMaxX - max) < eps) return;
    if (isNaN(newMinX) || isNaN(newMaxX)) return;
    const beforeZoomRange = this.getBeforeZoomRange(
      { min: newMinX, max: newMaxX },
      /** @type {any} */
      void 0
    );
    if (beforeZoomRange && beforeZoomRange.xaxis) {
      newMinX = beforeZoomRange.xaxis.min;
      newMaxX = beforeZoomRange.xaxis.max;
    }
    this._applyXRange(newMinX, newMaxX, true);
  }
  /** Fire the zoomed callback once the wheel gesture settles (mirrors _endPinch). */
  _endWheelZoom() {
    const w2 = this.w;
    const st = this._wheel();
    st.endTimer = null;
    if (w2.globals.isDestroyed || !w2.interact.zoomed) return;
    const { min, max } = this._currentXWindow();
    const yaxis = w2.globals.initialConfig ? Utils.clone(w2.globals.initialConfig.yaxis) : [];
    const toolbar = this.ctx.toolbar;
    if (toolbar) toolbar.zoomCallback({ min, max }, yaxis);
  }
  makeSelectionRectDraggable() {
    const w2 = this.w;
    if (!this.selectionRect) return;
    const rectDim = this.selectionRect.node.getBoundingClientRect();
    if (rectDim.width > 0 && rectDim.height > 0) {
      this.selectionRect.select(false).resize(false);
      this.selectionRect.select({
        createRot: () => {
        },
        updateRot: () => {
        },
        createHandle: (group, p2, index, pointArr, handleName) => {
          if (handleName === "l" || handleName === "r")
            return group.circle(8).css({ "stroke-width": 1, stroke: "#333", fill: "#fff" });
          return group.circle(0);
        },
        updateHandle: (group, p2) => {
          return group.center(p2[0], p2[1]);
        }
      }).resize().on("resize", () => {
        var _a;
        if (w2.interact.selectionEnabled) {
          w2.interact.selection = {
            x: parseFloat(this.selectionRect.node.getAttribute("x")),
            y: parseFloat(this.selectionRect.node.getAttribute("y")),
            width: parseFloat(this.selectionRect.node.getAttribute("width")),
            height: parseFloat(this.selectionRect.node.getAttribute("height"))
          };
          clearTimeout((_a = this.w.globals.selectionResizeTimer) != null ? _a : void 0);
          this.w.globals.selectionResizeTimer = window.setTimeout(() => {
            this._emitSelectionFromRect();
          }, 30);
        } else {
          const zoomtype = w2.interact.zoomEnabled ? w2.config.chart.zoom.type : w2.config.chart.selection.type;
          this.handleMouseUp({ zoomtype, isResized: true });
        }
      });
    }
  }
  preselectedSelection() {
    const w2 = this.w;
    const xyRatios = this.xyRatios;
    if (!w2.interact.zoomEnabled) {
      if (typeof w2.interact.selection !== "undefined" && w2.interact.selection !== null) {
        this.drawSelectionRect(__spreadProps(__spreadValues({}, w2.interact.selection), {
          translateX: w2.layout.translateX,
          translateY: w2.layout.translateY
        }));
      } else {
        if (w2.config.chart.selection.xaxis.min !== void 0 && w2.config.chart.selection.xaxis.max !== void 0) {
          let x = AxisMapping.dataXToPx(w2, w2.config.chart.selection.xaxis.min);
          let width = AxisMapping.dataXToPx(w2, w2.config.chart.selection.xaxis.max) - x;
          if (w2.axisFlags.isRangeBar) {
            x = (w2.config.chart.selection.xaxis.min - w2.globals.yAxisScale[0].niceMin) / xyRatios.invertedYRatio;
            width = (w2.config.chart.selection.xaxis.max - w2.config.chart.selection.xaxis.min) / xyRatios.invertedYRatio;
          }
          const selectionRect = {
            x,
            y: 0,
            width,
            height: w2.layout.gridHeight,
            translateX: w2.layout.translateX,
            translateY: w2.layout.translateY,
            selectionEnabled: true
          };
          this.drawSelectionRect(selectionRect);
          this.makeSelectionRectDraggable();
          if (typeof w2.config.chart.events.selection === "function") {
            w2.config.chart.events.selection(this.ctx, {
              xaxis: {
                min: w2.config.chart.selection.xaxis.min,
                max: w2.config.chart.selection.xaxis.max
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
    const w2 = this.w;
    const zoomRect = this.zoomRect;
    const selectionRect = this.selectionRect;
    if (this.dragged || w2.interact.selection !== null) {
      const scalingAttrs = {
        transform: "translate(" + translateX + ", " + translateY + ")"
      };
      if (w2.interact.zoomEnabled && this.dragged) {
        if (width < 0) width = 1;
        zoomRect.attr({
          x,
          y,
          width,
          height,
          fill: w2.config.chart.zoom.zoomedArea.fill.color,
          "fill-opacity": w2.config.chart.zoom.zoomedArea.fill.opacity,
          stroke: w2.config.chart.zoom.zoomedArea.stroke.color,
          "stroke-width": w2.config.chart.zoom.zoomedArea.stroke.width,
          "stroke-opacity": w2.config.chart.zoom.zoomedArea.stroke.opacity
        });
        Graphics.setAttrs(zoomRect.node, scalingAttrs);
      }
      if (w2.interact.selectionEnabled) {
        selectionRect.attr({
          x,
          y,
          width: width > 0 ? width : 0,
          height: height > 0 ? height : 0,
          fill: w2.config.chart.selection.fill.color,
          "fill-opacity": w2.config.chart.selection.fill.opacity,
          stroke: w2.config.chart.selection.stroke.color,
          "stroke-width": w2.config.chart.selection.stroke.width,
          "stroke-dasharray": w2.config.chart.selection.stroke.dashArray,
          "stroke-opacity": w2.config.chart.selection.stroke.opacity
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
    const w2 = this.w;
    const me = context;
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const startX = me.startX - 1;
    const startY = me.startY;
    let inversedX = false;
    let inversedY = false;
    const left = this._screenXToPlotPx(me.clientX);
    const top = me.clientY - gridRectDim.top;
    let selectionWidth = left - startX;
    let selectionHeight = top - startY;
    let selectionRect = {
      translateX: w2.layout.translateX,
      translateY: w2.layout.translateY
    };
    if (Math.abs(selectionWidth + startX) > w2.layout.gridWidth) {
      selectionWidth = w2.layout.gridWidth - startX;
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
        height: w2.layout.gridHeight
      };
    } else if (zoomtype === "y") {
      selectionRect = {
        x: 0,
        y: inversedY ? startY - selectionHeight : startY,
        width: w2.layout.gridWidth,
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
      translateX: w2.layout.translateX,
      translateY: w2.layout.translateY
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
    const w2 = this.w;
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
    w2.interact.selection = draggedProps;
    const link = w2.config.chart.link;
    const linkActive = !!(link && (link.enabled || typeof link.dimension === "function"));
    if ((typeof w2.config.chart.events.selection === "function" || linkActive) && w2.interact.selectionEnabled) {
      clearTimeout((_a = this.w.globals.selectionResizeTimer) != null ? _a : void 0);
      this.w.globals.selectionResizeTimer = window.setTimeout(() => {
        this._emitSelectionFromRect();
      }, timerInterval);
    }
  }
  /**
   * Recompute the reported x/y range from the CURRENT persistent selection rect
   * (via the shared AxisMapping) and notify listeners: chart.events.selection,
   * brushScrolled, and the crossfilter coordinator. Shared by the rect-body drag
   * (selectionDragging) and the handle resize (makeSelectionRectDraggable) so
   * every gesture re-reports through ONE mapping and the reported range always
   * matches the rect the user sees. No dragged/threshold gate: reaching here
   * already means the user moved or resized the persistent rect.
   */
  _emitSelectionFromRect() {
    var _a;
    const w2 = this.w;
    if (!w2.interact.selectionEnabled) return;
    const link = w2.config.chart.link;
    const linkActive = !!(link && (link.enabled || typeof link.dimension === "function"));
    if (typeof w2.config.chart.events.selection !== "function" && !linkActive) {
      return;
    }
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const selectionRect = this.selectionRect.node.getBoundingClientRect();
    const xyRatios = this.xyRatios;
    let minX, maxX, minY, maxY;
    const relLeft = this._screenXToPlotPx(selectionRect.left);
    const relRight = this._screenXToPlotPx(selectionRect.right);
    if (!w2.axisFlags.isRangeBar) {
      if (!w2.globals.xAxisScale) return;
      minX = AxisMapping.pxToDataX(w2, relLeft);
      maxX = AxisMapping.pxToDataX(w2, relRight);
      minY = w2.globals.yAxisScale[0].niceMin + (gridRectDim.bottom - selectionRect.bottom) * xyRatios.yRatio[0];
      maxY = w2.globals.yAxisScale[0].niceMax - (selectionRect.top - gridRectDim.top) * xyRatios.yRatio[0];
    } else {
      minX = w2.globals.yAxisScale[0].niceMin + relLeft * xyRatios.invertedYRatio;
      maxX = w2.globals.yAxisScale[0].niceMin + relRight * xyRatios.invertedYRatio;
      minY = 0;
      maxY = 1;
    }
    const xyAxis = {
      xaxis: { min: minX, max: maxX },
      yaxis: { min: minY, max: maxY }
    };
    if (typeof w2.config.chart.events.selection === "function") {
      w2.config.chart.events.selection(this.ctx, xyAxis);
    }
    if (w2.config.chart.brush.enabled && w2.config.chart.events.brushScrolled !== void 0) {
      w2.config.chart.events.brushScrolled(this.ctx, xyAxis);
    }
    (_a = this.ctx.linkedViews) == null ? void 0 : _a.onSourceSelection(xyAxis.xaxis);
  }
  /** @param {{context: any, zoomtype: any}} opts */
  selectionDrawn({ context, zoomtype }) {
    var _a;
    const w2 = this.w;
    const me = context;
    const xyRatios = this.xyRatios;
    const toolbar = this.ctx.toolbar;
    const selRect = w2.interact.zoomEnabled ? me.zoomRect.node.getBoundingClientRect() : me.selectionRect.node.getBoundingClientRect();
    const gridRectDim = me._gridRect();
    if (!gridRectDim) return;
    const localStartX = this._screenXToPlotPx(selRect.left);
    const localEndX = this._screenXToPlotPx(selRect.right);
    const localStartY = selRect.top - gridRectDim.top;
    const localEndY = selRect.bottom - gridRectDim.top;
    let xLowestValue, xHighestValue;
    if (!w2.axisFlags.isRangeBar) {
      xLowestValue = AxisMapping.pxToDataX(w2, localStartX);
      xHighestValue = AxisMapping.pxToDataX(w2, localEndX);
    } else {
      xLowestValue = w2.globals.yAxisScale[0].niceMin + localStartX * xyRatios.invertedYRatio;
      xHighestValue = w2.globals.yAxisScale[0].niceMin + localEndX * xyRatios.invertedYRatio;
    }
    const yHighestValue = [];
    const yLowestValue = [];
    w2.config.yaxis.forEach((yaxe, index) => {
      const seriesIndex = w2.globals.seriesYAxisMap[index][0];
      const highestVal = w2.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localStartY;
      const lowestVal = w2.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localEndY;
      yHighestValue.push(highestVal);
      yLowestValue.push(lowestVal);
    });
    if (me.dragged && (me.dragX > 10 || me.dragY > 10) && xLowestValue !== xHighestValue) {
      if (w2.interact.zoomEnabled) {
        if (!w2.globals.initialConfig) return;
        let yaxis = Utils.clone(w2.globals.initialConfig.yaxis);
        let xaxis = Utils.clone(w2.globals.initialConfig.xaxis);
        w2.interact.zoomed = true;
        if (w2.config.xaxis.convertedCatToNumeric) {
          xLowestValue = Math.floor(xLowestValue);
          xHighestValue = Math.floor(xHighestValue);
          if (xLowestValue < 1) {
            xLowestValue = 1;
            xHighestValue = w2.globals.dataPoints;
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
        if (!w2.config.chart.group) {
          options.yaxis = yaxis;
        }
        me.ctx.updateHelpers._updateOptions(
          options,
          false,
          me.w.config.chart.animations.dynamicAnimation.enabled
        );
        if (typeof w2.config.chart.events.zoomed === "function") {
          toolbar.zoomCallback(xaxis, yaxis);
        }
      } else if (w2.interact.selectionEnabled) {
        let yaxis = null;
        let xaxis = null;
        xaxis = {
          min: xLowestValue,
          max: xHighestValue
        };
        if (zoomtype === "xy" || zoomtype === "y") {
          const yaxisCopy = (
            /** @type {ApexYAxis[]} */
            Utils.clone(w2.config.yaxis)
          );
          yaxis = yaxisCopy;
          yaxisCopy.forEach((yaxe, index) => {
            yaxisCopy[index].min = yLowestValue[index];
            yaxisCopy[index].max = yHighestValue[index];
          });
        }
        w2.interact.selection = me.selection;
        if (typeof w2.config.chart.events.selection === "function") {
          w2.config.chart.events.selection(me.ctx, {
            xaxis,
            yaxis
          });
        }
        (_a = me.ctx.linkedViews) == null ? void 0 : _a.onSourceSelection(xaxis);
      }
    }
  }
  /** @param {{ context?: any, zoomtype?: any, xyRatios?: any }} opts */
  panDragging({ context }) {
    var _a;
    const w2 = this.w;
    const me = context;
    if (typeof w2.interact.lastClientPosition.x !== "undefined") {
      const deltaX = w2.interact.lastClientPosition.x - me.clientX;
      const deltaY = ((_a = w2.interact.lastClientPosition.y) != null ? _a : 0) - me.clientY;
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
    w2.interact.lastClientPosition = {
      x: me.clientX,
      y: me.clientY
    };
    const xLowestValue = w2.axisFlags.isRangeBar ? w2.globals.minY : w2.globals.minX;
    const xHighestValue = w2.axisFlags.isRangeBar ? w2.globals.maxY : w2.globals.maxX;
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
    var _a, _b;
    const w2 = this.w;
    const xyRatios = this.xyRatios;
    if (!w2.globals.initialConfig) return;
    const yaxis = Utils.clone(w2.globals.initialConfig.yaxis);
    let xRatio = xyRatios.xRatio;
    let minX = w2.globals.minX;
    let maxX = w2.globals.maxX;
    if (w2.axisFlags.isRangeBar) {
      xRatio = xyRatios.invertedYRatio;
      minX = w2.globals.minY;
      maxX = w2.globals.maxY;
    }
    if (this.moveDirection === "left") {
      xLowestValue = minX + w2.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
      xHighestValue = maxX + w2.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
    } else if (this.moveDirection === "right") {
      xLowestValue = minX - w2.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
      xHighestValue = maxX - w2.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
    }
    if (!w2.axisFlags.isRangeBar) {
      const clampMin = (_a = w2.globals.dataReducerRawMinX) != null ? _a : w2.globals.initialMinX;
      const clampMax = (_b = w2.globals.dataReducerRawMaxX) != null ? _b : w2.globals.initialMaxX;
      if (xLowestValue < clampMin || xHighestValue > clampMax) {
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
    if (!w2.config.chart.group) {
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
    const w2 = this.w;
    this.ctx.updateHelpers._updateOptions(options, false, false);
    if (typeof w2.config.chart.events.scrolled === "function") {
      const args = {
        xaxis: {
          min: xLowestValue,
          max: xHighestValue
        }
      };
      w2.config.chart.events.scrolled(this.ctx, args);
      this.ctx.events.fireEvent("scrolled", args);
    }
  }
  // ---------------------------------------------------------------------------
  // Momentum: multi-touch pinch-zoom, two-finger pan and kinetic inertia.
  //
  // Every _updateOptions destroys and recreates this instance, and applying a
  // gesture frame IS an _updateOptions, so the gesture must not depend on the
  // instance surviving. All runtime state lives on w.interact.momentum (the
  // interaction slice that persists across re-renders, like the crude pan's
  // lastClientPosition). The instance that received touchstart keeps driving
  // the gesture off the persistent state; inertia is a self-contained rAF loop
  // that stops on w.globals.isDestroyed (a real destroy) rather than being
  // cancelled by the per-update destroy().
  // ---------------------------------------------------------------------------
  _momentumEnabled() {
    return this._pinchEnabled() || this._panInertiaEnabled();
  }
  _pinchEnabled() {
    return this._incidentalZoomEnabled(this.w.config.chart.zoom.pinch);
  }
  _panInertiaEnabled() {
    const c = this.w.config.chart;
    return !!(c.pan && c.pan.inertia);
  }
  /** Lazily-created, re-render-surviving gesture state on the interaction slice. */
  _m() {
    const it = this.w.interact;
    if (!it.momentum) {
      it.momentum = {
        busy: false,
        /** @type {any} */
        pinch: null,
        /** @type {any} */
        panState: null,
        /** @type {{x:number,t:number}[]} */
        samples: [],
        /** @type {number|null} */
        inertiaRAF: null
      };
    }
    return it.momentum;
  }
  /** Current x data-window (rangeBars carry the datetime domain on y). */
  _currentXWindow() {
    const w2 = this.w;
    return w2.axisFlags.isRangeBar ? { min: w2.globals.minY, max: w2.globals.maxY } : { min: w2.globals.minX, max: w2.globals.maxX };
  }
  /** Live grid rect from the current DOM. Never cache the grid node on the
   * instance: a full render replaces this whole instance, but the fast update
   * path (fastUpdate/_fastAxisChromeRefresh) keeps the instance while swapping
   * the grid node, and a cached node would go stale (detached nodes report an
   * all-zero bounding rect, silently corrupting selection geometry). */
  _gridRect() {
    const baseEl = this.w.dom.baseEl;
    const grid = baseEl && baseEl.querySelector(".apexcharts-grid");
    return grid ? grid.getBoundingClientRect() : null;
  }
  /**
   * Convert an absolute (client) x pixel to the plot-origin coordinate space
   * that bar placement and the selection rect transform both use:
   * `screenX - svgLeft - translateX`. This is the ONLY correct reference for the
   * numeric/datetime x mapping (see AxisMapping): do NOT measure from the
   * `.apexcharts-grid` box and subtract barPadForNumericAxis, because on a
   * numeric bar chart that box extends barPad to the LEFT of the plot origin, so
   * the two corrections are a fragile pair that only cancels while the grid box
   * happens to extend exactly barPad. Anchoring on translateX (the same origin
   * the bars use) is stable regardless of grid padding.
   * @param {number} screenX
   * @returns {number}
   */
  _screenXToPlotPx(screenX) {
    return AxisMapping.screenXToPlotPx(this.w, screenX);
  }
  /**
   * Raw data bounds to clamp against. When zoom-aware downsampling is active,
   * the raw stash tracks the full domain; fall back to the initial window.
   * Returns null for rangeBars (no raw-x clamp available).
   * @returns {{min:number, max:number}|null}
   */
  _clampBounds() {
    var _a, _b;
    const w2 = this.w;
    if (w2.axisFlags.isRangeBar) return null;
    return {
      min: (_a = w2.globals.dataReducerRawMinX) != null ? _a : w2.globals.initialMinX,
      max: (_b = w2.globals.dataReducerRawMaxX) != null ? _b : w2.globals.initialMaxX
    };
  }
  /**
   * Apply an x-window immediately (no animation), mirroring panScrolled but
   * pixel-accurate: clamp to the raw bounds (preserving window width so a pan
   * stops flush at the edge rather than shrinking), floor for category axes,
   * then route through the fast _updateOptions path.
   * @param {number} newMinX @param {number} newMaxX @param {boolean} isZoom
   * @returns {{minX:number, maxX:number}|false} applied window, or false if rejected
   */
  _applyXRange(newMinX, newMaxX, isZoom) {
    const w2 = this.w;
    if (!w2.globals.initialConfig) return false;
    const cur = this._currentXWindow();
    const zoomingOut = isZoom && newMaxX - newMinX > cur.max - cur.min;
    const bounds = this._clampBounds();
    if (bounds) {
      const range = newMaxX - newMinX;
      if (newMinX < bounds.min) {
        newMinX = bounds.min;
        newMaxX = newMinX + range;
      }
      if (newMaxX > bounds.max) {
        newMaxX = bounds.max;
        newMinX = newMaxX - range;
      }
      if (newMinX < bounds.min) newMinX = bounds.min;
    }
    if (w2.config.xaxis.convertedCatToNumeric) {
      newMinX = Math.floor(newMinX);
      newMaxX = zoomingOut ? Math.ceil(newMaxX) : Math.floor(newMaxX);
      if (newMinX < 1) newMinX = 1;
      if (bounds && newMaxX > bounds.max) newMaxX = Math.floor(bounds.max);
      if (newMaxX - newMinX < 2) return false;
    }
    if (!(newMaxX > newMinX)) return false;
    const options = { xaxis: { min: newMinX, max: newMaxX } };
    if (!w2.config.chart.group) {
      options.yaxis = Utils.clone(w2.globals.initialConfig.yaxis);
    }
    if (isZoom) w2.interact.zoomed = true;
    this.ctx.updateHelpers._updateOptions(options, false, false);
    return { minX: newMinX, maxX: newMaxX };
  }
  _cancelInertia() {
    const m2 = this._m();
    if (m2.inertiaRAF != null) {
      cancelAnimationFrame(m2.inertiaRAF);
      m2.inertiaRAF = null;
    }
  }
  _fireScrolled() {
    const w2 = this.w;
    if (typeof w2.config.chart.events.scrolled !== "function") return;
    const { min, max } = this._currentXWindow();
    const args = { xaxis: { min, max } };
    w2.config.chart.events.scrolled(this.ctx, args);
    this.ctx.events.fireEvent("scrolled", args);
  }
  /** @param {number} x @param {number} t */
  _pushSample(x, t) {
    const s = this._m().samples;
    s.push({ x, t });
    while (s.length > 6) s.shift();
  }
  /**
   * Single passive:false handler for all touch phases. Two fingers => pinch /
   * two-finger pan (zoom). One finger, in pan mode => kinetic pan with inertia.
   * @param {any} e
   */
  momentumTouch(e) {
    const w2 = this.w;
    const m2 = this._m();
    const type = e.type;
    if (type === "touchstart") {
      this._cancelInertia();
      const gridRectDim = this._gridRect();
      if (!gridRectDim) return;
      if (e.touches.length >= 2 && this._pinchEnabled()) {
        e.preventDefault();
        m2.busy = true;
        m2.panState = null;
        this._beginPinch(e, gridRectDim);
      } else if (e.touches.length === 1 && this._panInertiaEnabled() && w2.interact.panEnabled) {
        m2.busy = true;
        m2.pinch = null;
        const t = e.touches[0];
        const win = this._currentXWindow();
        const gw = w2.layout.gridWidth || 1;
        m2.panState = {
          startX: t.clientX,
          startY: t.clientY,
          axis: null,
          // decided on first move (rails)
          minX0: win.min,
          maxX0: win.max,
          ratio0: (win.max - win.min) / gw
        };
        m2.samples = [{ x: t.clientX, t: e.timeStamp }];
      }
      return;
    }
    if (type === "touchmove") {
      if (m2.pinch && e.touches.length >= 2) {
        e.preventDefault();
        this._movePinch(e);
      } else if (m2.panState && e.touches.length === 1) {
        this._movePan(e);
      }
      return;
    }
    if (m2.pinch) {
      if (e.touches.length < 2) this._endPinch();
    } else if (m2.panState) {
      if (e.touches.length === 0) this._endPan();
    }
    if (e.touches.length === 0) {
      w2.interact.mousedown = false;
      this.dragged = false;
      if (m2.inertiaRAF == null && !m2.pinch && !m2.panState) {
        m2.busy = false;
      }
    }
  }
  /** @param {any} e @param {DOMRect} gridRectDim */
  _beginPinch(e, gridRectDim) {
    const w2 = this.w;
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1;
    const cx = (t0.clientX + t1.clientX) / 2 - gridRectDim.left - w2.globals.barPadForNumericAxis;
    const { min, max } = this._currentXWindow();
    this._m().pinch = {
      d0: dist,
      cx0: cx,
      minX0: min,
      maxX0: max,
      gridWidth: w2.layout.gridWidth || 1
    };
  }
  /** @param {any} e */
  _movePinch(e) {
    const w2 = this.w;
    const p2 = this._m().pinch;
    if (!p2) return;
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1;
    const cx = (t0.clientX + t1.clientX) / 2 - gridRectDim.left - w2.globals.barPadForNumericAxis;
    const range0 = p2.maxX0 - p2.minX0;
    const newRange = range0 * (p2.d0 / dist);
    const anchorData = p2.minX0 + p2.cx0 / p2.gridWidth * range0;
    let newMinX = anchorData - cx / p2.gridWidth * newRange;
    let newMaxX = newMinX + newRange;
    const bounds = this._clampBounds();
    if (bounds) {
      const minXDiff = w2.globals.minXDiff > 0 && isFinite(w2.globals.minXDiff) ? w2.globals.minXDiff : 0;
      const minRange = Math.max(minXDiff * 2, (bounds.max - bounds.min) * 1e-6);
      if (newMaxX - newMinX < minRange) {
        const mid = (newMinX + newMaxX) / 2;
        newMinX = mid - minRange / 2;
        newMaxX = mid + minRange / 2;
      }
    }
    this._applyXRange(newMinX, newMaxX, true);
  }
  _endPinch() {
    const w2 = this.w;
    const m2 = this._m();
    m2.pinch = null;
    const { min, max } = this._currentXWindow();
    const xaxis = { min, max };
    const yaxis = w2.globals.initialConfig ? Utils.clone(w2.globals.initialConfig.yaxis) : [];
    const toolbar = this.ctx.toolbar;
    if (toolbar) toolbar.zoomCallback(xaxis, yaxis);
  }
  /** @param {any} e */
  _movePan(e) {
    const m2 = this._m();
    const s = m2.panState;
    const t = e.touches[0];
    if (!s.axis) {
      const dx = Math.abs(t.clientX - s.startX);
      const dy = Math.abs(t.clientY - s.startY);
      if (dx < 6 && dy < 6) {
        this._pushSample(t.clientX, e.timeStamp);
        return;
      }
      if (dy > dx) {
        m2.busy = false;
        m2.panState = null;
        return;
      }
      s.axis = "x";
    }
    if (s.axis !== "x") return;
    e.preventDefault();
    const totalDeltaPx = t.clientX - s.startX;
    const deltaData = totalDeltaPx * s.ratio0;
    this._pushSample(t.clientX, e.timeStamp);
    this._applyXRange(s.minX0 - deltaData, s.maxX0 - deltaData, false);
  }
  _endPan() {
    const m2 = this._m();
    const s = m2.panState;
    m2.panState = null;
    let vel = 0;
    const samples = m2.samples;
    if (samples.length >= 2) {
      const a = samples[0];
      const b2 = samples[samples.length - 1];
      const dt = b2.t - a.t;
      if (dt > 0) vel = (b2.x - a.x) / dt;
    }
    m2.samples = [];
    if (s && s.axis === "x" && this._panInertiaEnabled() && Math.abs(vel) > INERTIA_MIN_RELEASE_VELOCITY) {
      this._startInertia(vel);
    } else {
      m2.busy = false;
      this._fireScrolled();
    }
  }
  /**
   * Kinetic glide after a one-finger pan release: decay the velocity by
   * `friction` each frame and shift the window, stopping at the data edge
   * (clamp, not elastic overshoot). The loop is w-driven, so it keeps running
   * across the re-renders each frame triggers and stops only on a real destroy.
   * @param {number} vel0 px/ms, sign is the finger direction
   */
  _startInertia(vel0) {
    const w2 = this.w;
    const m2 = this._m();
    const cfgFriction = w2.config.chart.pan && w2.config.chart.pan.friction;
    const friction = typeof cfgFriction === "number" ? Math.min(Math.max(cfgFriction, 0.5), 0.999) : INERTIA_DEFAULT_FRICTION;
    let vel = vel0;
    let lastT = null;
    m2.busy = true;
    const step = (ts) => {
      if (w2.globals.isDestroyed) {
        m2.inertiaRAF = null;
        m2.busy = false;
        return;
      }
      if (lastT == null) {
        lastT = ts;
        m2.inertiaRAF = requestAnimationFrame(step);
        return;
      }
      const dt = ts - lastT;
      lastT = ts;
      vel *= Math.pow(friction, dt / FRAME_MS_60FPS);
      if (Math.abs(vel) < INERTIA_STOP_VELOCITY) {
        m2.inertiaRAF = null;
        m2.busy = false;
        this._fireScrolled();
        return;
      }
      const win = this._currentXWindow();
      const gw = w2.layout.gridWidth || 1;
      const ratio = (win.max - win.min) / gw;
      const deltaData = vel * dt * ratio;
      const applied = this._applyXRange(
        win.min - deltaData,
        win.max - deltaData,
        false
      );
      const bounds = this._clampBounds();
      const hitEdge = !applied || bounds && (deltaData > 0 && applied.minX <= bounds.min + (bounds.max - bounds.min) * 1e-6 || deltaData < 0 && applied.maxX >= bounds.max - (bounds.max - bounds.min) * 1e-6);
      if (hitEdge) {
        m2.inertiaRAF = null;
        m2.busy = false;
        this._fireScrolled();
        return;
      }
      m2.inertiaRAF = requestAnimationFrame(step);
    };
    m2.inertiaRAF = requestAnimationFrame(step);
  }
}
_core__default.registerFeatures({
  toolbar: Toolbar,
  zoomPanSelection: ZoomPanSelection
});
let Helpers$2 = class Helpers2 {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
  }
  /**
   * @param {Record<string, any>} anno
   * @param {number | null} [annoIndex]
   */
  setOrientations(anno, annoIndex = null) {
    var _a, _b;
    const w2 = this.w;
    if (anno.label.orientation === "vertical") {
      const i = annoIndex !== null ? annoIndex : 0;
      const xAnno = w2.dom.baseEl.querySelector(
        `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`
      );
      if (xAnno !== null) {
        const xAnnoCoord = (
          /** @type {SVGGraphicsElement} */
          xAnno.getBBox()
        );
        xAnno.setAttribute(
          "x",
          String(
            parseFloat((_a = xAnno.getAttribute("x")) != null ? _a : "0") - xAnnoCoord.height + 4
          )
        );
        const yOffset = anno.label.position === "top" ? xAnnoCoord.width : -xAnnoCoord.width;
        xAnno.setAttribute(
          "y",
          String(parseFloat((_b = xAnno.getAttribute("y")) != null ? _b : "0") + yOffset)
        );
        const { x, y } = this.annoCtx.graphics.rotateAroundCenter(xAnno);
        xAnno.setAttribute("transform", `rotate(-90 ${x} ${y})`);
      }
    }
  }
  /**
   * @param {any} annoEl
   * @param {Record<string, any>} anno
   */
  addBackgroundToAnno(annoEl, anno) {
    const w2 = this.w;
    if (!annoEl || !anno.label.text || !String(anno.label.text).trim()) {
      return null;
    }
    const gridEl = w2.dom.baseEl.querySelector(".apexcharts-grid");
    if (!gridEl) return null;
    const elGridRect = gridEl.getBoundingClientRect();
    const gridBBox = (
      /** @type {SVGGraphicsElement} */
      gridEl.getBBox()
    );
    const zoom = elGridRect.width / gridBBox.width || 1;
    const coords = annoEl.getBoundingClientRect();
    let {
      left: pleft,
      right: pright,
      top: ptop,
      bottom: pbottom
    } = anno.label.style.padding;
    if (anno.label.orientation === "vertical") {
      [ptop, pbottom, pleft, pright] = [pleft, pright, ptop, pbottom];
    }
    const gridLeft = elGridRect.left - gridBBox.x * zoom;
    const gridTop = elGridRect.top - gridBBox.y * zoom;
    const x1 = (coords.left - gridLeft) / zoom - pleft;
    const y1 = (coords.top - gridTop) / zoom - ptop;
    const elRect = this.annoCtx.graphics.drawRect(
      x1,
      y1,
      coords.width / zoom + pleft + pright,
      coords.height / zoom + ptop + pbottom,
      anno.label.borderRadius,
      anno.label.style.background,
      1,
      anno.label.borderWidth,
      anno.label.borderColor,
      0
    );
    if (anno.id) {
      elRect.node.classList.add(anno.id);
    }
    return elRect;
  }
  annotationsBackground() {
    const w2 = this.w;
    const add = (anno, i, type) => {
      const annoLabel = w2.dom.baseEl.querySelector(
        `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i}']`
      );
      if (annoLabel) {
        const parent = annoLabel.parentNode;
        const elRect = this.addBackgroundToAnno(annoLabel, anno);
        if (elRect) {
          parent == null ? void 0 : parent.insertBefore(elRect.node, annoLabel);
          const labelX = annoLabel.getAttribute("x");
          if (labelX !== null) {
            applyProgressiveReveal(elRect, parseFloat(labelX), w2);
          }
          if (anno.label.mouseEnter) {
            elRect.node.addEventListener(
              "mouseenter",
              anno.label.mouseEnter.bind(this, anno)
            );
          }
          if (anno.label.mouseLeave) {
            elRect.node.addEventListener(
              "mouseleave",
              anno.label.mouseLeave.bind(this, anno)
            );
          }
          if (anno.label.click) {
            elRect.node.addEventListener(
              "click",
              anno.label.click.bind(this, anno)
            );
          }
        }
      }
    };
    w2.config.annotations.xaxis.forEach(
      (anno, i) => add(anno, i, "xaxis")
    );
    w2.config.annotations.yaxis.forEach(
      (anno, i) => add(anno, i, "yaxis")
    );
    w2.config.annotations.points.forEach(
      (anno, i) => add(anno, i, "point")
    );
  }
  /**
   * Does the x position take the category branch of `getX1X2` (a label lookup)
   * rather than projecting through a numeric domain? Mirrors the conditions
   * applied there, so the two cannot drift apart.
   *
   * @returns {boolean}
   */
  usesCategoryX() {
    const w2 = this.w;
    return (w2.config.xaxis.type === "category" || w2.config.xaxis.convertedCatToNumeric) && !this.annoCtx.invertAxis && !w2.axisFlags.dataFormatXNumeric && !w2.config.chart.sparkline.enabled;
  }
  /**
   * Is there a real domain for an x position to project through?
   *
   * An empty series still gets a laid-out grid and a y scale (the default 0..6,
   * or the configured `yaxis.min`/`max`), which is why a y-axis annotation is
   * always placeable. Nothing bounds the x domain though: `maxX` is left
   * undefined and `xRange` is NaN, and a category axis has no labels to index
   * into. Projecting through that is silently wrong rather than merely absent:
   * NaN sails past the clip comparisons in `getX1X2` (both `NaN > gridWidth`
   * and `NaN < 0` are false), and the category branch hands back the raw value
   * as a pixel offset, so `x: 5` draws 5px from the grid's left edge.
   *
   * Gating each annotation on this replaces the chart-wide `dataPoints` check
   * that used to sit in `drawAxesAnnotations()` (#1832), which suppressed the
   * placeable y-axis annotations along with the unplaceable x ones (#5278).
   *
   * @returns {boolean}
   */
  hasXDomain() {
    const w2 = this.w;
    if (this.annoCtx.invertAxis) {
      return Utils.isNumber(w2.globals.minY) && Utils.isNumber(w2.globals.yRange[0]);
    }
    if (this.usesCategoryX()) {
      return w2.labelData.labels.length > 0 || w2.labelData.categoryLabels.length > 0;
    }
    return Utils.isNumber(w2.globals.minX) && Utils.isNumber(w2.globals.xRange);
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getY1Y2(type, anno) {
    var _a, _b, _c;
    const w2 = this.w;
    const y = type === "y1" ? anno.y : anno.y2;
    const isPx = typeof y === "string" && y.includes("px");
    let yP;
    let clipped = false;
    if (this.annoCtx.invertAxis) {
      const labels = w2.config.xaxis.convertedCatToNumeric ? w2.labelData.categoryLabels : w2.labelData.labels;
      const catIndex = labels.indexOf(y);
      if (!isPx && catIndex === -1) {
        return { yP: 0, clipped: true };
      }
      const xLabel = w2.dom.baseEl.querySelector(
        `.apexcharts-yaxis-texts-g text:nth-child(${catIndex + 1})`
      );
      yP = xLabel ? parseFloat((_a = xLabel.getAttribute("y")) != null ? _a : "0") : (w2.layout.gridHeight / labels.length - 1) * (catIndex + 1) - w2.globals.barHeight;
      if (anno.seriesIndex !== void 0 && w2.globals.barHeight) {
        yP -= w2.globals.barHeight / 2 * (w2.seriesData.series.length - 1) - w2.globals.barHeight * anno.seriesIndex;
      }
    } else {
      if (!w2.config.yaxis[anno.yAxisIndex]) {
        return { yP: 0, clipped: true };
      }
      const yAxisMap = w2.globals.seriesYAxisMap[anno.yAxisIndex];
      const seriesIndex = (_b = yAxisMap == null ? void 0 : yAxisMap[0]) != null ? _b : null;
      if (seriesIndex === null && w2.seriesData.series.length) {
        return { yP: 0, clipped: true };
      }
      const yMin = seriesIndex === null ? w2.globals.minY : w2.globals.minYArr[seriesIndex];
      const yRange = seriesIndex === null ? w2.globals.maxY - w2.globals.minY : w2.globals.yRange[seriesIndex];
      const yPos = w2.config.yaxis[anno.yAxisIndex].logarithmic && seriesIndex !== null ? new CoreUtils(this.w).getLogVal(
        w2.config.yaxis[anno.yAxisIndex].logBase,
        y,
        seriesIndex
      ) / /** @type {any} */
      w2.globals.yLogRatio[seriesIndex] : (y - yMin) / (yRange / w2.layout.gridHeight);
      yP = w2.layout.gridHeight - Math.min(Math.max(yPos, 0), w2.layout.gridHeight);
      clipped = yPos > w2.layout.gridHeight || yPos < 0;
      if (anno.marker && (anno.y === void 0 || anno.y === null)) {
        yP = 0;
      }
      if ((_c = w2.config.yaxis[anno.yAxisIndex]) == null ? void 0 : _c.reversed) {
        yP = yPos;
      }
    }
    if (isPx) {
      yP = parseFloat(
        /** @type {string} */
        y
      );
    }
    return { yP, clipped };
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getX1X2(type, anno) {
    const w2 = this.w;
    const x = type === "x1" ? anno.x : anno.x2;
    const min = this.annoCtx.invertAxis ? w2.globals.minY : w2.globals.minX;
    const max = this.annoCtx.invertAxis ? w2.globals.maxY : w2.globals.maxX;
    const range = this.annoCtx.invertAxis ? w2.globals.yRange[0] : w2.globals.xRange;
    let clipped = false;
    const isPx = typeof x === "string" && x.includes("px");
    const isEdgeMarker = (x === void 0 || x === null) && anno.marker;
    if (!isPx && !isEdgeMarker && !this.hasXDomain()) {
      return { x: 0, clipped: true };
    }
    let xP = this.annoCtx.inversedReversedAxis ? (max - x) / (range / w2.layout.gridWidth) : (x - min) / (range / w2.layout.gridWidth);
    if ((w2.config.xaxis.type === "category" || w2.config.xaxis.convertedCatToNumeric) && !this.annoCtx.invertAxis && !w2.axisFlags.dataFormatXNumeric) {
      if (!w2.config.chart.sparkline.enabled) {
        xP = this.getStringX(x);
      }
    }
    if (typeof x === "string" && x.includes("px")) {
      xP = parseFloat(x);
    }
    if ((x === void 0 || x === null) && anno.marker) {
      xP = w2.layout.gridWidth;
    }
    if (anno.seriesIndex !== void 0 && w2.globals.barWidth && !this.annoCtx.invertAxis) {
      xP -= w2.globals.barWidth / 2 * (w2.seriesData.series.length - 1) - w2.globals.barWidth * anno.seriesIndex;
    }
    if (typeof xP !== "number") {
      xP = 0;
      clipped = true;
    }
    if (parseFloat(xP.toFixed(10)) > parseFloat(w2.layout.gridWidth.toFixed(10))) {
      xP = w2.layout.gridWidth;
      clipped = true;
    } else if (xP < 0) {
      xP = 0;
      clipped = true;
    }
    return { x: xP, clipped };
  }
  /**
   * @param {number} x
   */
  getStringX(x) {
    var _a;
    const w2 = this.w;
    let rX = x;
    if (w2.config.xaxis.convertedCatToNumeric && w2.labelData.categoryLabels.length) {
      const strX = String(x);
      x = w2.labelData.categoryLabels.findIndex(
        (l) => String(l) === strX
      ) + 1;
    }
    const catIndex = w2.labelData.labels.map(
      (item) => Array.isArray(item) ? item.join(" ") : item
    ).indexOf(x);
    const xLabel = w2.dom.baseEl.querySelector(
      `.apexcharts-xaxis-texts-g text:nth-child(${catIndex + 1})`
    );
    if (xLabel) {
      rX = parseFloat((_a = xLabel.getAttribute("x")) != null ? _a : "0");
    }
    return rX;
  }
};
class XAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.invertAxis = this.annoCtx.invertAxis;
    this.helpers = new Helpers$2(this.annoCtx);
  }
  /**
   * @param {XAxisAnnotations} anno
   * @param {Element} parent
   * @param {number} index
   */
  addXaxisAnnotation(anno, parent, index) {
    const w2 = this.w;
    const result = this.helpers.getX1X2("x1", anno);
    let x1 = result.x;
    const clipX1 = result.clipped;
    let clipX2 = true;
    let x2;
    const text = anno.label.text;
    const strokeDashArray = anno.strokeDashArray;
    if (!Utils.isNumber(x1)) return;
    if (anno.x2 === null || typeof anno.x2 === "undefined") {
      if (!clipX1) {
        const line = this.annoCtx.graphics.drawLine(
          x1 + anno.offsetX,
          // x1
          0 + anno.offsetY,
          // y1
          x1 + anno.offsetX,
          // x2
          w2.layout.gridHeight + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          //dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
        applyProgressiveReveal(line, x1 + anno.offsetX, w2);
      }
    } else {
      const result2 = this.helpers.getX1X2("x2", anno);
      x2 = result2.x;
      clipX2 = result2.clipped;
      if (x2 < x1) {
        const temp = x1;
        x1 = x2;
        x2 = temp;
      }
      const rect = this.annoCtx.graphics.drawRect(
        x1 + anno.offsetX,
        // x1
        0 + anno.offsetY,
        // y1
        x2 - x1,
        // x2
        w2.layout.gridHeight + anno.offsetY,
        // y2
        0,
        // radius
        anno.fillColor,
        // color
        anno.opacity,
        // opacity,
        1,
        // strokeWidth
        anno.borderColor,
        // strokeColor
        strokeDashArray
        // stokeDashArray
      );
      rect.node.classList.add("apexcharts-annotation-rect");
      rect.attr("clip-path", `url(#gridRectMask${w2.globals.cuid})`);
      parent.appendChild(rect.node);
      if (anno.id) {
        rect.node.classList.add(anno.id);
      }
      applyProgressiveReveal(rect, x1 + anno.offsetX, w2);
    }
    if (!(clipX1 && clipX2)) {
      const textRects = this.annoCtx.graphics.getTextRects(
        text,
        anno.label.style.fontSize
      );
      const textY = anno.label.position === "top" ? 4 : anno.label.position === "center" ? w2.layout.gridHeight / 2 + (anno.label.orientation === "vertical" ? textRects.width / 2 : 0) : w2.layout.gridHeight;
      const elText = this.annoCtx.graphics.drawText({
        x: x1 + anno.label.offsetX,
        y: textY + anno.label.offsetY - (anno.label.orientation === "vertical" ? anno.label.position === "top" ? textRects.width / 2 - 12 : -textRects.width / 2 : 0),
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-xaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      applyProgressiveReveal(elText, x1 + anno.label.offsetX, w2);
      this.annoCtx.helpers.setOrientations(anno, index);
    }
  }
  drawXAxisAnnotations() {
    const w2 = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-xaxis-annotations"
    });
    w2.config.annotations.xaxis.map(
      (anno, index) => {
        this.addXaxisAnnotation(anno, elg.node, index);
      }
    );
    return elg;
  }
}
class YAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers$2(this.annoCtx);
    this.axesUtils = new AxesUtils(this.annoCtx.w, {
      theme: this.annoCtx.theme,
      timeScale: this.annoCtx.timeScale
    });
  }
  /**
   * @param {YAxisAnnotations} anno
   * @param {Element} parent
   * @param {number} index
   */
  addYaxisAnnotation(anno, parent, index) {
    const w2 = this.w;
    const strokeDashArray = anno.strokeDashArray;
    let result = this.helpers.getY1Y2("y1", anno);
    let y1 = result.yP;
    const clipY1 = result.clipped;
    let y2;
    let clipY2 = true;
    let drawn = false;
    const text = anno.label.text;
    if (anno.y2 === null || typeof anno.y2 === "undefined") {
      if (!clipY1) {
        drawn = true;
        const line = this.annoCtx.graphics.drawLine(
          0 + anno.offsetX,
          // x1
          y1 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          // dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
      }
    } else {
      result = this.helpers.getY1Y2("y2", anno);
      y2 = result.yP;
      clipY2 = result.clipped;
      if (y2 > y1) {
        const temp = y1;
        y1 = y2;
        y2 = temp;
      }
      if (!(clipY1 && clipY2)) {
        drawn = true;
        const rect = this.annoCtx.graphics.drawRect(
          0 + anno.offsetX,
          // x1
          y2 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 - y2,
          // y2
          0,
          // radius
          anno.fillColor,
          // color
          anno.opacity,
          // opacity,
          1,
          // strokeWidth
          anno.borderColor,
          // strokeColor
          strokeDashArray
          // stokeDashArray
        );
        rect.node.classList.add("apexcharts-annotation-rect");
        rect.attr("clip-path", `url(#gridRectMask${w2.globals.cuid})`);
        parent.appendChild(rect.node);
        if (anno.id) {
          rect.node.classList.add(anno.id);
        }
      }
    }
    if (drawn) {
      const textX = anno.label.position === "right" ? w2.layout.gridWidth : anno.label.position === "center" ? w2.layout.gridWidth / 2 : 0;
      const elText = this.annoCtx.graphics.drawText({
        x: textX + anno.label.offsetX,
        y: (y2 != null ? y2 : y1) + anno.label.offsetY - 3,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-yaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
    }
  }
  /**
   * @param {YAxisAnnotations} anno
   */
  _getYAxisAnnotationWidth(anno) {
    const w2 = this.w;
    let width = w2.layout.gridWidth;
    if (anno.width.indexOf("%") > -1) {
      width = w2.layout.gridWidth * parseInt(anno.width, 10) / 100;
    } else {
      width = parseInt(anno.width, 10);
    }
    return width + anno.offsetX;
  }
  drawYAxisAnnotations() {
    const w2 = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-yaxis-annotations"
    });
    w2.config.annotations.yaxis.forEach(
      (anno, index) => {
        anno.yAxisIndex = this.axesUtils.translateYAxisIndex(anno.yAxisIndex);
        if (!(this.axesUtils.isYAxisHidden(anno.yAxisIndex) && this.axesUtils.yAxisAllSeriesCollapsed(anno.yAxisIndex))) {
          this.addYaxisAnnotation(anno, elg.node, index);
        }
      }
    );
    return elg;
  }
}
class PointAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers$2(this.annoCtx);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    const w2 = this.w;
    if (w2.globals.collapsedSeriesIndices.indexOf(anno.seriesIndex) > -1) {
      return;
    }
    const resultX = this.helpers.getX1X2("x1", anno);
    const x = resultX.x;
    const clipX = resultX.clipped;
    const resultY = this.helpers.getY1Y2("y1", anno);
    const y = resultY.yP;
    const clipY = resultY.clipped;
    if (!Utils.isNumber(x)) return;
    if (!(clipY || clipX)) {
      const optsPoints = {
        pSize: anno.marker.size,
        pointStrokeWidth: anno.marker.strokeWidth,
        pointFillColor: anno.marker.fillColor,
        pointStrokeColor: anno.marker.strokeColor,
        shape: anno.marker.shape,
        pRadius: anno.marker.radius,
        class: `apexcharts-point-annotation-marker ${anno.marker.cssClass} ${anno.id ? anno.id : ""}`
      };
      let point = this.annoCtx.graphics.drawMarker(
        x + anno.marker.offsetX,
        y + anno.marker.offsetY,
        optsPoints
      );
      parent.appendChild(point.node);
      const tooltipTargets = [point.node];
      applyProgressiveReveal(point, x, w2);
      const text = anno.label.text ? anno.label.text : "";
      const elText = this.annoCtx.graphics.drawText({
        x: x + anno.label.offsetX,
        y: y + anno.label.offsetY - anno.marker.size - parseFloat(anno.label.style.fontSize) / 1.6,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-point-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      applyProgressiveReveal(elText, x, w2);
      if (anno.customSVG.SVG) {
        const g2 = this.annoCtx.graphics.group({
          class: "apexcharts-point-annotations-custom-svg " + anno.customSVG.cssClass
        });
        g2.attr({
          transform: `translate(${x + anno.customSVG.offsetX}, ${y + anno.customSVG.offsetY})`
        });
        g2.node.innerHTML = anno.customSVG.SVG;
        parent.appendChild(g2.node);
        tooltipTargets.push(g2.node);
      }
      if (anno.image.path) {
        const imgWidth = anno.image.width ? anno.image.width : 20;
        const imgHeight = anno.image.height ? anno.image.height : 20;
        point = this.annoCtx.addImage({
          x: x + anno.image.offsetX - imgWidth / 2,
          y: y + anno.image.offsetY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          path: anno.image.path,
          appendTo: ".apexcharts-point-annotations"
        });
        tooltipTargets.push(point.node);
      }
      if (anno.tooltip && anno.tooltip.enabled) {
        tooltipTargets.forEach((node) => {
          node.addEventListener("mouseenter", () => {
            this.showPointTooltip(anno, node);
          });
          node.addEventListener("mouseleave", () => {
            this.hidePointTooltip();
          });
        });
      }
      if (anno.mouseEnter) {
        point.node.addEventListener(
          "mouseenter",
          anno.mouseEnter.bind(this, anno)
        );
      }
      if (anno.mouseLeave) {
        point.node.addEventListener(
          "mouseleave",
          anno.mouseLeave.bind(this, anno)
        );
      }
      if (anno.click) {
        point.node.addEventListener("click", anno.click.bind(this, anno));
      }
    }
  }
  /**
   * Lazily create (once per chart) and return the shared HTML element used to
   * render point-annotation tooltips. Reuses the `.apexcharts-tooltip` glass
   * styling; the `.apexcharts-annotation-tooltip` modifier adds padding and
   * text wrapping for free-form content.
   * @returns {HTMLElement}
   */
  getPointTooltipEl() {
    const w2 = this.w;
    let el = (
      /** @type {HTMLElement | null} */
      w2.dom.elWrap.querySelector(".apexcharts-annotation-tooltip")
    );
    if (!el) {
      el = /** @type {HTMLElement} */
      BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "div");
      el.classList.add("apexcharts-tooltip", "apexcharts-annotation-tooltip");
      w2.dom.elWrap.appendChild(el);
    }
    return el;
  }
  /**
   * Resolve the tooltip markup for a point annotation. Precedence:
   * `tooltip.formatter` (fn) -> `tooltip.text` -> `label.text`. Arrays are
   * joined with line breaks.
   * @param {Record<string, any>} anno
   * @returns {string}
   */
  getPointTooltipContent(anno) {
    const w2 = this.w;
    const tt = anno.tooltip || {};
    if (typeof tt.formatter === "function") {
      return tt.formatter({
        annotation: anno,
        seriesIndex: anno.seriesIndex,
        id: anno.id,
        w: w2
      });
    }
    let content = tt.text != null ? tt.text : anno.label && anno.label.text;
    if (Array.isArray(content)) {
      content = content.join("<br/>");
    }
    return content == null ? "" : String(content);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} targetNode the hovered marker / image / custom-SVG node
   */
  showPointTooltip(anno, targetNode) {
    const w2 = this.w;
    const content = this.getPointTooltipContent(anno);
    if (!content) return;
    const el = this.getPointTooltipEl();
    el.innerHTML = content;
    const theme = anno.tooltip.theme || w2.config.tooltip.theme || "light";
    el.classList.remove("apexcharts-theme-light", "apexcharts-theme-dark");
    el.classList.add(`apexcharts-theme-${theme}`);
    el.classList.add("apexcharts-active");
    const wrapRect = w2.dom.elWrap.getBoundingClientRect();
    const markRect = targetNode.getBoundingClientRect();
    const ttRect = el.getBoundingClientRect();
    const offsetX = anno.tooltip.offsetX || 0;
    const offsetY = anno.tooltip.offsetY || 0;
    let left = markRect.left - wrapRect.left + markRect.width / 2 - ttRect.width / 2;
    let top = markRect.top - wrapRect.top - ttRect.height - 10;
    left = Math.max(0, Math.min(left, wrapRect.width - ttRect.width));
    if (top < 0) {
      top = markRect.top - wrapRect.top + markRect.height + 10;
    }
    el.style.left = left + offsetX + "px";
    el.style.top = top + offsetY + "px";
  }
  hidePointTooltip() {
    const el = (
      /** @type {HTMLElement | null} */
      this.w.dom.elWrap.querySelector(".apexcharts-annotation-tooltip")
    );
    if (el) {
      el.classList.remove("apexcharts-active");
    }
  }
  drawPointAnnotations() {
    const w2 = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-point-annotations"
    });
    w2.config.annotations.points.map(
      (anno, index) => {
        this.addPointAnnotation(anno, elg.node, index);
      }
    );
    return elg;
  }
}
class Annotations {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w2, { theme = null, timeScale = null } = {}) {
    this.w = w2;
    this.theme = theme;
    this.timeScale = timeScale;
    this.invertAxis = void 0;
    this.inversedReversedAxis = void 0;
    this.graphics = new Graphics(this.w);
    if (this.w.globals.isBarHorizontal) {
      this.invertAxis = true;
    }
    this.helpers = new Helpers$2(this);
    this.xAxisAnnotations = new XAnnotations(this);
    this.yAxisAnnotations = new YAnnotations(this);
    this.pointsAnnotations = new PointAnnotations(this);
    if (this.w.globals.isBarHorizontal && this.w.config.yaxis[0].reversed) {
      this.inversedReversedAxis = true;
    }
    this.xDivision = this.w.layout.gridWidth / this.w.globals.dataPoints;
  }
  drawAxesAnnotations() {
    const w2 = this.w;
    if (w2.globals.axisCharts) {
      const yAnnotations = this.yAxisAnnotations.drawYAxisAnnotations();
      const xAnnotations = this.xAxisAnnotations.drawXAxisAnnotations();
      const pointAnnotations = this.pointsAnnotations.drawPointAnnotations();
      const initialAnim = w2.config.chart.animations.enabled;
      const annoArray = [yAnnotations, xAnnotations, pointAnnotations];
      const annoElArray = [
        xAnnotations.node,
        yAnnotations.node,
        pointAnnotations.node
      ];
      const progressiveAnnos = w2.config.chart.type === "line" || w2.config.chart.type === "area" || w2.config.chart.type === "rangeArea";
      const skipGroupHide = [progressiveAnnos, false, progressiveAnnos];
      for (let i = 0; i < 3; i++) {
        w2.dom.elGraphical.add(annoArray[i]);
        if (initialAnim && !w2.globals.resized && !w2.globals.dataChanged) {
          if (w2.config.chart.type !== "scatter" && w2.config.chart.type !== "bubble" && w2.globals.dataPoints > 1 && !skipGroupHide[i]) {
            annoElArray[i].classList.add("apexcharts-element-hidden");
          }
        }
        w2.globals.delayedElements.push({ el: annoElArray[i], index: 0 });
      }
      this.helpers.annotationsBackground();
    }
  }
  drawImageAnnos() {
    const w2 = this.w;
    w2.config.annotations.images.map((s) => {
      this.addImage(s);
    });
  }
  drawTextAnnos() {
    const w2 = this.w;
    w2.config.annotations.texts.map((t) => {
      this.addText(t);
    });
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addXaxisAnnotation(anno, parent, index) {
    this.xAxisAnnotations.addXaxisAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addYaxisAnnotation(anno, parent, index) {
    this.yAxisAnnotations.addYaxisAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    this.pointsAnnotations.addPointAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} params
   */
  addText(params) {
    const {
      x,
      y,
      text,
      textAnchor,
      foreColor,
      fontSize,
      fontFamily,
      fontWeight,
      cssClass,
      backgroundColor,
      borderWidth,
      strokeDashArray,
      borderRadius,
      borderColor,
      appendTo = ".apexcharts-svg",
      paddingLeft = 4,
      paddingRight = 4,
      paddingBottom = 2,
      paddingTop = 2
    } = params;
    const w2 = this.w;
    const elText = this.graphics.drawText({
      x,
      y,
      text,
      textAnchor: textAnchor || "start",
      fontSize: fontSize || "12px",
      fontWeight: fontWeight || "regular",
      fontFamily: fontFamily || w2.config.chart.fontFamily,
      foreColor: foreColor || w2.config.chart.foreColor,
      cssClass: "apexcharts-text " + cssClass ? cssClass : ""
    });
    const parent = w2.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(elText.node);
    }
    const textRect = elText.bbox();
    if (text) {
      const elRect = this.graphics.drawRect(
        textRect.x - paddingLeft,
        textRect.y - paddingTop,
        textRect.width + paddingLeft + paddingRight,
        textRect.height + paddingBottom + paddingTop,
        borderRadius,
        backgroundColor ? backgroundColor : "transparent",
        1,
        borderWidth,
        borderColor,
        strokeDashArray
      );
      parent.insertBefore(elRect.node, elText.node);
    }
  }
  /**
   * @param {Record<string, any>} params
   */
  addImage(params) {
    const w2 = this.w;
    const {
      path,
      x = 0,
      y = 0,
      width = 20,
      height = 20,
      appendTo = ".apexcharts-svg"
    } = params;
    const img = w2.dom.Paper.image(path);
    img.size(width, height).move(x, y);
    const parent = w2.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(img.node);
    }
    return img;
  }
  // The addXaxisAnnotation method requires a parent class, and user calling this method externally on the chart instance may not specify parent, hence a different method
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addXaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "xaxis",
      contextMethod: context.addXaxisAnnotation
    });
    return context;
  }
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addYaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "yaxis",
      contextMethod: context.addYaxisAnnotation
    });
    return context;
  }
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addPointAnnotationExternal(params, pushToMemory, context) {
    if (typeof this.invertAxis === "undefined") {
      this.invertAxis = context.w.globals.isBarHorizontal;
    }
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "point",
      contextMethod: context.addPointAnnotation
    });
    return context;
  }
  /** @param {{params: any, pushToMemory: any, context: any, type: any, contextMethod: any}} opts */
  addAnnotationExternal({
    params,
    pushToMemory,
    context,
    type,
    contextMethod
  }) {
    const me = context;
    const w2 = me.w;
    const parent = w2.dom.baseEl.querySelector(`.apexcharts-${type}-annotations`);
    const index = parent.childNodes.length + 1;
    const options = new Options();
    const axesAnno = Object.assign(
      {},
      type === "xaxis" ? options.xAxisAnnotation : type === "yaxis" ? options.yAxisAnnotation : options.pointAnnotation
    );
    const anno = Utils.extend(axesAnno, params);
    switch (type) {
      case "xaxis":
        this.addXaxisAnnotation(anno, parent, index);
        break;
      case "yaxis":
        this.addYaxisAnnotation(anno, parent, index);
        break;
      case "point":
        this.addPointAnnotation(anno, parent, index);
        break;
    }
    const axesAnnoLabel = w2.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${index}']`
    );
    const elRect = this.helpers.addBackgroundToAnno(axesAnnoLabel, anno);
    if (elRect) {
      parent.insertBefore(elRect.node, axesAnnoLabel);
    }
    if (pushToMemory) {
      w2.globals.memory.methodsToExec.push({
        context: me,
        id: anno.id ? anno.id : Utils.randomId(),
        method: contextMethod,
        label: "addAnnotation",
        params
      });
    }
    return context;
  }
  /**
   * Remove the shared point-annotation hover tooltip node.
   *
   * `hidePointTooltip` is wired only to the marker's `mouseleave`; if the marker
   * is torn down while hovered (clearAnnotations / removeAnnotation / a redraw),
   * that never fires and the tooltip is left `.apexcharts-active`. A stale active
   * annotation tooltip then permanently suppresses the series tooltip (see the
   * guard in Tooltip.drawTooltip added by b1369f5ab). Removing the node clears
   * both the ghost box and the stale state; it is recreated on the next hover.
   * @param {any} w
   */
  _removeAnnotationTooltip(w2) {
    const el = w2.dom.elWrap && w2.dom.elWrap.querySelector(".apexcharts-annotation-tooltip");
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   */
  clearAnnotations(ctx) {
    const w2 = ctx.w;
    this._removeAnnotationTooltip(w2);
    const annos = w2.dom.baseEl.querySelectorAll(
      ".apexcharts-yaxis-annotations, .apexcharts-xaxis-annotations, .apexcharts-point-annotations"
    );
    for (let i = w2.globals.memory.methodsToExec.length - 1; i >= 0; i--) {
      if (w2.globals.memory.methodsToExec[i].label === "addText" || w2.globals.memory.methodsToExec[i].label === "addAnnotation") {
        w2.globals.memory.methodsToExec.splice(i, 1);
      }
    }
    Array.prototype.forEach.call(annos, (a) => {
      while (a.firstChild) {
        a.removeChild(a.firstChild);
      }
    });
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {string} id
   */
  removeAnnotation(ctx, id) {
    const w2 = ctx.w;
    this._removeAnnotationTooltip(w2);
    const annos = w2.dom.baseEl.querySelectorAll(`.${id}`);
    if (annos) {
      w2.globals.memory.methodsToExec.map((m2, i) => {
        if (m2.id === id) {
          w2.globals.memory.methodsToExec.splice(i, 1);
        }
      });
      Object.keys(w2.config.annotations).forEach((key) => {
        const annotationArray = w2.config.annotations[key];
        if (Array.isArray(annotationArray)) {
          w2.config.annotations[key] = annotationArray.filter((m2) => m2.id !== id);
        }
      });
      Array.prototype.forEach.call(annos, (a) => {
        a.parentElement.removeChild(a);
      });
    }
  }
}
_core__default.registerFeatures({ annotations: Annotations });
class KeyboardNavigation {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    this.seriesIndex = 0;
    this.dataPointIndex = 0;
    this.active = false;
    this._tooltipDismissed = false;
    this._focusedEl = null;
    this._hoveredBarEl = null;
    this._enlargedScatterMarker = null;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onLegendClick = this._onLegendClick.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._lastPointerDownAt = 0;
  }
  // ─── Public API ───────────────────────────────────────────────────────────
  /**
   * Called after the chart and tooltip have been fully rendered.
   * Attaches event listeners and makes the SVG keyboard-focusable.
   */
  init() {
    const w2 = this.w;
    const svgEl = w2.dom.Paper.node;
    if (!svgEl) return;
    svgEl.setAttribute("tabindex", "0");
    svgEl.addEventListener("focus", this._onFocus);
    svgEl.addEventListener("blur", this._onBlur);
    svgEl.addEventListener("mousedown", this._onPointerDown, { capture: true });
    svgEl.addEventListener("pointerdown", this._onPointerDown, {
      capture: true
    });
    svgEl.addEventListener("touchstart", this._onPointerDown, {
      capture: true,
      passive: true
    });
    svgEl.addEventListener("keydown", this._onKeyDown, { passive: false });
    this.ctx.events.addEventListener("legendClick", this._onLegendClick);
  }
  /**
   * Removes all event listeners. Called from chart.destroy().
   */
  destroy() {
    const w2 = this.w;
    const svgEl = w2.dom.Paper && w2.dom.Paper.node;
    this.ctx.events.removeEventListener("legendClick", this._onLegendClick);
    if (!svgEl) return;
    svgEl.removeEventListener("focus", this._onFocus);
    svgEl.removeEventListener("blur", this._onBlur);
    svgEl.removeEventListener("keydown", this._onKeyDown);
    svgEl.removeEventListener(
      "mousedown",
      this._onPointerDown,
      /** @type {any} */
      { capture: true }
    );
    svgEl.removeEventListener(
      "pointerdown",
      this._onPointerDown,
      /** @type {any} */
      { capture: true }
    );
    svgEl.removeEventListener(
      "touchstart",
      this._onPointerDown,
      /** @type {any} */
      { capture: true }
    );
  }
  // Records the timestamp of the most recent pointer-down inside the SVG.
  // `_onFocus` reads this to distinguish keyboard-driven focus (no recent
  // pointer activity) from mouse-driven focus (pointer event within the
  // last 100 ms). Stays a no-op for keyboard users.
  _onPointerDown() {
    this._lastPointerDownAt = Date.now();
  }
  /**
   * Called from Events.js keydown handler. Navigation keys are already handled
   * by the direct SVG listener (which can call preventDefault). This entry
   * point is intentionally a no-op — Events.js still fires the public keyDown
   * callback and fireEvent('keydown') independently.
   * @param {Event} _e
   */
  handleKey(_e) {
  }
  // ─── Focus / blur ─────────────────────────────────────────────────────────
  _onFocus() {
    if (!this._isNavEnabled()) return;
    if (Date.now() - this._lastPointerDownAt < 100) {
      return;
    }
    this.active = true;
    this._clampCursor();
    this._snapToVisibleRange();
    this._showCurrentPoint();
  }
  _onBlur() {
    this.active = false;
    this._tooltipDismissed = false;
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
  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    var _a, _b, _c;
    if (!this._isNavEnabled() || !this.active) return;
    if (e.shiftKey && (e.key === "ArrowRight" || e.key === "ArrowLeft") && this._canPan()) {
      e.preventDefault();
      this._panBy(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
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
      case "+":
      case "=":
        if (this._canZoom()) {
          e.preventDefault();
          (_a = this.ctx.toolbar) == null ? void 0 : _a.handleZoomIn();
          this._announce("Zoomed in");
        }
        break;
      case "-":
      case "_":
        if (this._canZoom()) {
          e.preventDefault();
          (_b = this.ctx.toolbar) == null ? void 0 : _b.handleZoomOut();
          this._announce("Zoomed out");
        }
        break;
      case "0":
        if (this._canZoom() && this.w.interact.zoomed) {
          e.preventDefault();
          (_c = this.ctx.toolbar) == null ? void 0 : _c.handleZoomReset();
          this._announce("Zoom reset");
        }
        break;
      case "Escape":
        e.preventDefault();
        if (!this._tooltipDismissed) {
          this._tooltipDismissed = true;
          this._hideFocus();
        } else {
          this.active = false;
          this._tooltipDismissed = false;
          this._hideFocus();
        }
        break;
    }
  }
  // ─── Zoom / pan (keyboard alternatives for drag gestures) ─────────────────
  _canZoom() {
    const w2 = this.w;
    return Boolean(
      w2.globals.axisCharts && w2.config.chart.zoom && w2.config.chart.zoom.enabled
    );
  }
  _canPan() {
    return this._canZoom();
  }
  /**
   * Shift the visible x-range by ~10% in the given direction.
   * @param {number} direction +1 = right, -1 = left
   */
  _panBy(direction) {
    const w2 = this.w;
    const toolbar = this.ctx.toolbar;
    if (!toolbar) return;
    const minX = Number(w2.globals.minX);
    const maxX = Number(w2.globals.maxX);
    if (!isFinite(minX) || !isFinite(maxX) || minX === maxX) return;
    const span = maxX - minX;
    const step = span * 0.1 * direction;
    toolbar.zoomUpdateOptions(minX + step, maxX + step);
    this._announce(direction > 0 ? "Panned right" : "Panned left");
  }
  // ─── Navigation ───────────────────────────────────────────────────────────
  /**
   * @param {number} dSeries
   * @param {number} dPoint
   */
  _move(dSeries, dPoint) {
    const w2 = this.w;
    const wrapAround = w2.config.chart.accessibility.keyboard.navigation.wrapAround;
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
        if (!w2.globals.collapsedSeriesIndices.includes(si)) break;
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
    const w2 = this.w;
    const si = this.seriesIndex;
    const dpCount = this._getDataPointCount(si);
    let di = this.dataPointIndex;
    let attempts = 0;
    if (!Array.isArray(w2.seriesData.series[si])) return;
    while (attempts < dpCount && w2.seriesData.series[si][di] === null) {
      di = (di + 1) % dpCount;
      attempts++;
    }
    this.dataPointIndex = di;
  }
  /** Retreat dataPointIndex backward past any nulls */
  _skipNullBackward() {
    const w2 = this.w;
    const si = this.seriesIndex;
    const dpCount = this._getDataPointCount(si);
    let di = this.dataPointIndex;
    let attempts = 0;
    if (!Array.isArray(w2.seriesData.series[si])) return;
    while (attempts < dpCount && w2.seriesData.series[si][di] === null) {
      di = (di - 1 + dpCount) % dpCount;
      attempts++;
    }
    this.dataPointIndex = di;
  }
  // ─── Display ──────────────────────────────────────────────────────────────
  _showCurrentPoint() {
    const { seriesIndex: i, dataPointIndex: j } = this;
    const w2 = this.w;
    const ttCtx = w2.globals.tooltip;
    if (!ttCtx || !ttCtx.ttItems) return;
    w2.interact.capturedSeriesIndex = i;
    w2.interact.capturedDataPointIndex = j;
    this._applyFocusClass(i, j);
    this._showTooltip(
      i,
      j,
      /** @type {any} */
      ttCtx
    );
  }
  _hideFocus() {
    const w2 = this.w;
    const ttCtx = (
      /** @type {any} */
      w2.globals.tooltip
    );
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
      if (w2.config.chart.accessibility.enabled && w2.config.chart.accessibility.announcements.enabled) {
        tooltipEl.setAttribute("aria-hidden", "true");
      }
    }
    w2.dom.baseEl.classList.remove("apexcharts-tooltip-active");
    const xcrosshairs = ttCtx.getElXCrosshairs();
    if (xcrosshairs) xcrosshairs.classList.remove("apexcharts-active");
  }
  // ─── Tooltip display per chart type ───────────────────────────────────────
  /**
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltip(i, j, ttCtx) {
    const w2 = this.w;
    const type = w2.config.chart.type;
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
    w2.dom.baseEl.classList.add("apexcharts-tooltip-active");
    tooltipEl.classList.add("apexcharts-active");
    if (w2.config.chart.accessibility.enabled && w2.config.chart.accessibility.announcements.enabled) {
      tooltipEl.removeAttribute("aria-hidden");
    }
    if (type === "pie" || type === "donut" || type === "polarArea") {
      this._showTooltipNonAxis(i, j, ttCtx, tooltipEl);
    } else if (type === "radialBar") {
      this._showTooltipRadialBar(i, j, ttCtx, tooltipEl);
    } else if (type === "heatmap" || type === "treemap") {
      this._showTooltipHeatTree(i, j, ttCtx, tooltipEl, type);
    } else if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "violin" || type === "rangeBar") {
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
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _setSyntheticEvent(i, j, ttCtx) {
    const w2 = this.w;
    const type = w2.config.chart.type;
    let clientX = 0;
    let clientY = 0;
    const el = this._getFocusableElement(i, j);
    if (el) {
      const rect = el.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    } else if (w2.globals.pointsArray && w2.globals.pointsArray[i] && w2.globals.pointsArray[i][j]) {
      const pt = w2.globals.pointsArray[i][j];
      const elGrid = ttCtx.getElGrid && ttCtx.getElGrid();
      if (elGrid) {
        const gridRect = elGrid.getBoundingClientRect();
        clientX = gridRect.left + (pt[0] || 0);
        clientY = gridRect.top + (pt[1] || 0);
      }
    } else {
      const svgEl = w2.dom.Paper && w2.dom.Paper.node;
      if (svgEl) {
        const svgRect = svgEl.getBoundingClientRect();
        clientX = svgRect.left + svgRect.width / 2;
        clientY = svgRect.top + svgRect.height / 2;
      }
    }
    if (type === "line" || type === "area" || type === "rangeArea" || type === "scatter" || type === "bubble" || type === "radar") {
      if (w2.globals.pointsArray && w2.globals.pointsArray[i] && w2.globals.pointsArray[i][j]) {
        const pt = w2.globals.pointsArray[i][j];
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
  /**
   * bar / column / candlestick / boxPlot / rangeBar
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltipBar(i, j, ttCtx) {
    var _a, _b, _c, _d;
    const w2 = this.w;
    const shared = ttCtx.tConfig.shared && (ttCtx.tooltipUtil.isXoverlap(j) || w2.globals.isBarHorizontal) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
    const rangeData = (
      /** @type {any} */
      (_d = (_c = (_b = (_a = w2.rangeData.seriesRange) == null ? void 0 : _a[i]) == null ? void 0 : _b[j]) == null ? void 0 : _c.y) == null ? void 0 : _d[0]
    );
    ttCtx.tooltipLabels.drawSeriesTexts(__spreadProps(__spreadValues(__spreadValues({
      ttItems: ttCtx.ttItems,
      i,
      j
    }, (rangeData == null ? void 0 : rangeData.y1) !== void 0 && { y1: rangeData.y1 }), (rangeData == null ? void 0 : rangeData.y2) !== void 0 && { y2: rangeData.y2 }), {
      shared
    }));
    const parent = `.apexcharts-series[data\\:realIndex='${i}']`;
    const elPath = w2.dom.Paper.findOne(
      `${parent} path[j='${j}'], ${parent} circle[j='${j}'], ${parent} rect[j='${j}']`
    );
    if (elPath) {
      this._leaveHoveredBar();
      const graphics = new Graphics(this.w, this.ctx);
      graphics.pathMouseEnter(elPath, null);
      this._hoveredBarEl = elPath;
    }
    if (w2.globals.isBarHorizontal) {
      const barDomEl = elPath && elPath.node;
      if (barDomEl) {
        const wrapRect = w2.dom.elWrap.getBoundingClientRect();
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
  /**
   * line / area / scatter / bubble / radar / rangeArea
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltipAxisLine(i, j, ttCtx) {
    const w2 = this.w;
    const type = w2.config.chart.type;
    const sharedConfigured = ttCtx.tConfig.shared;
    const shared = sharedConfigured && ttCtx.tooltipUtil.isXoverlap(j) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      j,
      shared
    });
    const isScatterLike = type === "scatter" || type === "bubble";
    const hasVisibleMarkers = w2.globals.markers.largestSize > 0 && !w2.globals.markers.batched;
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
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
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
  /**
   * pie / donut / polarArea
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   */
  _showTooltipNonAxis(i, j, ttCtx, tooltipEl) {
    const w2 = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: j,
      shared: false
    });
    const tooltipBound = tooltipEl.getBoundingClientRect();
    const ttWidth = tooltipBound.width || ttCtx.tooltipRect.ttWidth || 0;
    const ttHeight = tooltipBound.height || ttCtx.tooltipRect.ttHeight || 0;
    const sliceEl = w2.dom.baseEl.querySelector(`.apexcharts-pie-area[j='${j}']`);
    const anchor = ttCtx.getSliceAnchor(sliceEl);
    if (anchor) {
      tooltipEl.style.left = anchor.x - ttWidth / 2 + "px";
      tooltipEl.style.top = anchor.y - ttHeight - 10 + "px";
    }
  }
  /**
   * radialBar — one ring per series, single value each
   * @param {number} i
   * @param {any} _j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   */
  _showTooltipRadialBar(i, _j, ttCtx, tooltipEl) {
    var _a;
    const w2 = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      shared: false
    });
    const { ttWidth = 0, ttHeight = 0 } = ttCtx.getCachedDimensions();
    const arcEl = w2.dom.baseEl.querySelector(
      `.apexcharts-radialbar-series[data\\:realIndex='${i}'] path`
    );
    if (arcEl) {
      const angle = parseFloat((_a = arcEl.getAttribute("data:angle")) != null ? _a : "") || 0;
      const initialAngle = w2.config.plotOptions.radialBar.startAngle || 0;
      const midAngle = initialAngle + angle / 2;
      const centerX = w2.layout.gridWidth / 2;
      const centerY = w2.layout.gridHeight / 2;
      const radialSize = w2.globals.radialSize || Math.min(w2.layout.gridWidth, w2.layout.gridHeight) / 2;
      const seriesCount = w2.seriesData.series.length;
      const trackSize = radialSize / Math.max(seriesCount, 1);
      const outerRadius = radialSize - i * trackSize;
      const innerRadius = outerRadius - trackSize;
      const ringRadius = (outerRadius + innerRadius) / 2;
      const centroid = Utils.polarToCartesian(
        centerX,
        centerY,
        ringRadius,
        midAngle
      );
      const x = centroid.x + (w2.layout.translateX || 0);
      const y = centroid.y + (w2.layout.translateY || 0);
      tooltipEl.style.left = x - ttWidth / 2 + "px";
      tooltipEl.style.top = y - ttHeight - 10 + "px";
    }
  }
  /**
   * heatmap / treemap — position tooltip using element bounding rect
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   * @param {string} type
   */
  _showTooltipHeatTree(i, j, ttCtx, tooltipEl, type) {
    var _a, _b;
    const w2 = this.w;
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
    const cell = w2.dom.baseEl.querySelector(`.${rectClass}[i='${i}'][j='${j}']`);
    if (cell) {
      const wrapRect = w2.dom.elWrap.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const cellCx = cellRect.left - wrapRect.left;
      const cellCy = cellRect.top - wrapRect.top;
      const cellWidth = cellRect.width;
      const cellHeight = cellRect.height;
      const cx = parseFloat((_a = cell.getAttribute("cx")) != null ? _a : "");
      const cellWidthAttr = parseFloat((_b = cell.getAttribute("width")) != null ? _b : "");
      ttCtx.tooltipPosition.moveXCrosshairs(cx + cellWidthAttr / 2);
      let x = cellCx + cellWidth + ttWidth / 2;
      const y = cellCy + cellHeight / 2 - ttHeight / 2;
      if (cellCx + cellWidth > w2.layout.gridWidth / 2) {
        x = cellCx - ttWidth / 2;
      }
      tooltipEl.style.left = x + "px";
      tooltipEl.style.top = y + "px";
    }
  }
  // ─── Focus class management ───────────────────────────────────────────────
  /**
   * @param {number} i
   * @param {number} j
   */
  _applyFocusClass(i, j) {
    this._removeFocusClass();
    const el = this._getFocusableElement(i, j) || this._getBatchedFocusEl(i);
    if (el) {
      el.classList.add("apexcharts-keyboard-focused");
      el.setAttribute("role", "img");
      const label = this._buildPointLabel(i, j);
      if (label) el.setAttribute("aria-label", label);
      this._focusedEl = el;
    }
  }
  /**
   * A batched series has no `.apexcharts-marker[rel]` node to carry the focus
   * ring and aria-label, so the focus lands on the tooltip's own marker for
   * that series instead: `_showTooltip` moves it onto the focused point in this
   * same task, so it is the element the reader sees highlighted. Only used when
   * batching is on, since with per-point nodes the exact node is better.
   * @param {number} i
   * @returns {Element | null}
   */
  _getBatchedFocusEl(i) {
    if (!this.w.globals.markers.batched) return null;
    return this.w.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i}'] .apexcharts-series-markers path`
    );
  }
  _removeFocusClass() {
    if (this._focusedEl) {
      this._focusedEl.classList.remove("apexcharts-keyboard-focused");
      this._focusedEl.removeAttribute("role");
      this._focusedEl.removeAttribute("aria-label");
      this._focusedEl = null;
    }
  }
  /**
   * Build an accessible label for the data point at (i, j) using the same
   * formatters the visible tooltip / axis labels use, so SR output matches
   * the visual presentation.
   * @param {number} i
   * @param {number} j
   * @returns {string}
   */
  _buildPointLabel(i, j) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w2 = this.w;
    const type = w2.config.chart.type;
    const seriesNames = w2.seriesData.seriesNames || [];
    const series = w2.seriesData.series || [];
    if (type === "pie" || type === "donut" || type === "polarArea") {
      const sliceLabel = (_b = ((_a = w2.labelData) == null ? void 0 : _a.labels) && w2.labelData.labels[j]) != null ? _b : "";
      const value = Array.isArray(series) ? series[j] : "";
      return sliceLabel ? `${sliceLabel}: ${value}` : `${value}`;
    }
    if (type === "radialBar") {
      const seriesName2 = seriesNames[i] || `Series ${i + 1}`;
      const value = Array.isArray(series) ? series[i] : "";
      return `${seriesName2}: ${value}`;
    }
    const seriesName = seriesNames[i] || `Series ${i + 1}`;
    const row = Array.isArray(series[i]) ? series[i] : [];
    const rawValue = row[j];
    let formattedValue = rawValue == null ? "" : String(rawValue);
    const yFormatter = (_d = (_c = w2.formatters) == null ? void 0 : _c.yLabelFormatters) == null ? void 0 : _d[i];
    if (typeof yFormatter === "function") {
      try {
        formattedValue = yFormatter(rawValue, {
          seriesIndex: i,
          dataPointIndex: j,
          w: w2
        });
      } catch (e) {
      }
    }
    let category = "";
    const categoryLabels = (_e = w2.labelData) == null ? void 0 : _e.categoryLabels;
    const seriesX = (_g = (_f = w2.seriesData) == null ? void 0 : _f.seriesX) == null ? void 0 : _g[i];
    if (Array.isArray(categoryLabels) && categoryLabels[j] != null) {
      category = String(categoryLabels[j]);
    } else if (Array.isArray(seriesX) && seriesX[j] != null) {
      const xFormatter = (_h = w2.formatters) == null ? void 0 : _h.xLabelFormatter;
      if (typeof xFormatter === "function") {
        try {
          category = String(
            xFormatter(seriesX[j], { seriesIndex: i, dataPointIndex: j, w: w2 })
          );
        } catch (e) {
          category = String(seriesX[j]);
        }
      } else {
        category = String(seriesX[j]);
      }
    }
    return category ? `${seriesName}: ${formattedValue}, ${category}` : `${seriesName}: ${formattedValue}`;
  }
  _leaveHoveredBar() {
    if (this._hoveredBarEl) {
      const graphics = new Graphics(this.w, this.ctx);
      graphics.pathMouseLeave(this._hoveredBarEl, null);
      this._hoveredBarEl = null;
    }
  }
  /**
   * @param {number} i
   * @param {number} j
   */
  _getFocusableElement(i, j) {
    const w2 = this.w;
    const type = w2.config.chart.type;
    const baseEl = w2.dom.baseEl;
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
    if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "violin" || type === "rangeBar") {
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
    const w2 = this.w;
    const ttCtx = w2.globals.tooltip;
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
    const w2 = this.w;
    const type = w2.config.chart.type;
    if (type === "pie" || type === "donut" || type === "polarArea") {
      return 1;
    }
    return w2.seriesData.series.length;
  }
  /**
   * @param {number} si
   */
  _getDataPointCount(si) {
    const w2 = this.w;
    const type = w2.config.chart.type;
    if (type === "pie" || type === "donut" || type === "polarArea") {
      return w2.seriesData.series.length;
    }
    const series = w2.seriesData.series;
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
    const w2 = this.w;
    const gl = w2.globals;
    const si = this.seriesIndex;
    if (!w2.interact.zoomed) return;
    const seriesX = w2.seriesData.seriesX && w2.seriesData.seriesX[si];
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
   * @param {number} direction
   */
  _snapToVisibleRangeInDirection(direction) {
    const w2 = this.w;
    const gl = w2.globals;
    const si = this.seriesIndex;
    const seriesX = w2.seriesData.seriesX && w2.seriesData.seriesX[si];
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
   * @param {number} si
   * @param {number} di
   */
  _isDataPointVisible(si, di) {
    const w2 = this.w;
    const gl = w2.globals;
    if (!w2.interact.zoomed) return true;
    const seriesX = w2.seriesData.seriesX && w2.seriesData.seriesX[si];
    if (!seriesX) return true;
    const x = seriesX[di];
    if (x === void 0) return true;
    return x >= gl.minX && x <= gl.maxX;
  }
  /**
   * Push a short status message to the visually-hidden aria-live region so
   * screen readers announce zoom / pan / reset events that have no inherent
   * tooltip update. Silently no-op if the region is missing or announcements
   * are disabled.
   * @param {string} message
   */
  _announce(message) {
    const w2 = this.w;
    if (!w2.config.chart.accessibility.announcements.enabled) return;
    const baseEl = w2.dom.baseEl;
    if (!baseEl) return;
    const region = baseEl.querySelector(".apexcharts-sr-status");
    if (!region) return;
    region.textContent = "";
    setTimeout(() => {
      region.textContent = message;
    }, 0);
  }
}
_core__default.registerFeatures({ keyboardNavigation: KeyboardNavigation });
function gridDivideRect(bbox, count) {
  if (!(count > 0)) return [];
  if (count === 1) return [__spreadValues({}, bbox)];
  const horizontal = bbox.width >= bbox.height;
  const rowExtent = horizontal ? bbox.width : bbox.height;
  const colExtent = horizontal ? bbox.height : bbox.width;
  const ratio = colExtent > 0 ? rowExtent / colExtent : count;
  let rows = Math.max(1, Math.ceil(Math.sqrt(ratio * count)));
  if (rows > count) rows = count;
  const baseCols = Math.floor(count / rows);
  let remainder = count - baseCols * rows;
  const cells = [];
  const rowSize = rowExtent / rows;
  let rowStart = 0;
  for (let r = 0; r < rows; r++) {
    const cols = baseCols + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const colSize = cols > 0 ? colExtent / cols : 0;
    for (let c = 0; c < cols; c++) {
      cells.push(
        horizontal ? {
          x: bbox.x + rowStart,
          y: bbox.y + c * colSize,
          width: rowSize,
          height: colSize
        } : {
          x: bbox.x + c * colSize,
          y: bbox.y + rowStart,
          width: colSize,
          height: rowSize
        }
      );
    }
    rowStart += rowSize;
  }
  return cells;
}
function gridDivideShape(bbox, count, intervalsAt) {
  if (!(count > 0)) return [];
  const horizontal = bbox.width >= bbox.height;
  const rowExtent = horizontal ? bbox.width : bbox.height;
  const colExtent = horizontal ? bbox.height : bbox.width;
  const minorLo = horizontal ? bbox.y : bbox.x;
  const minorHi = minorLo + colExtent;
  const ratio = colExtent > 0 ? rowExtent / colExtent : count;
  let rows = Math.max(
    Math.ceil(Math.sqrt(ratio * count)),
    Math.ceil(rowExtent / 16)
  );
  if (!(rows >= 1)) rows = 1;
  if (rows > count) rows = count;
  const baseCols = Math.floor(count / rows);
  let remainder = count - baseCols * rows;
  const cells = [];
  const rowSize = rowExtent / rows;
  let rowStart = horizontal ? bbox.x : bbox.y;
  for (let r = 0; r < rows; r++) {
    const cols = baseCols + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const spans = [];
    const raw = intervalsAt(rowStart, rowStart + rowSize, horizontal);
    if (Array.isArray(raw)) {
      for (let s = 0; s < raw.length; s++) {
        const iv = raw[s];
        if (!iv) continue;
        const lo = Math.max(minorLo, Math.min(iv[0], iv[1]));
        const hi = Math.min(minorHi, Math.max(iv[0], iv[1]));
        if (hi > lo) spans.push([lo, hi]);
      }
    }
    if (!spans.length) spans.push([minorLo, minorHi]);
    const totalLen = spans.reduce((a, s) => a + (s[1] - s[0]), 0);
    const exact = spans.map(
      (s) => totalLen > 0 ? (s[1] - s[0]) / totalLen * cols : cols / spans.length
    );
    const share = exact.map((v2) => Math.floor(v2));
    let used = share.reduce((a, b2) => a + b2, 0);
    const byFrac = exact.map((v2, i) => ({ i, frac: v2 - Math.floor(v2) })).sort((a, b2) => b2.frac - a.frac);
    for (let k = 0; used < cols; k++, used++) {
      share[byFrac[k % byFrac.length].i]++;
    }
    for (let s = 0; s < spans.length; s++) {
      const n = share[s];
      if (n <= 0) continue;
      const lo = spans[s][0];
      const colSize = (spans[s][1] - lo) / n;
      for (let c = 0; c < n; c++) {
        cells.push(
          horizontal ? { x: rowStart, y: lo + c * colSize, width: rowSize, height: colSize } : { x: lo + c * colSize, y: rowStart, width: colSize, height: rowSize }
        );
      }
    }
    rowStart += rowSize;
  }
  return cells;
}
function hilbertIndex(x, y, minX, minY, maxX, maxY) {
  let ix = maxX === minX ? 0 : Math.round(32767 * ((x - minX) / (maxX - minX)));
  let iy = maxY === minY ? 0 : Math.round(32767 * ((y - minY) / (maxY - minY)));
  let d = 0;
  for (let s = 32768; s >= 1; s /= 2) {
    const rx = (ix & s) > 0 ? 1 : 0;
    const ry = (iy & s) > 0 ? 1 : 0;
    d += s * s * (3 * rx ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        ix = s - 1 - ix;
        iy = s - 1 - iy;
      }
      const t = ix;
      ix = iy;
      iy = t;
    }
  }
  return d;
}
function sortByHilbert(items, getXY) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const pts = items.map((it) => {
    const [x, y] = getXY(it);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    return [x, y];
  });
  return items.map((item, k) => ({
    item,
    d: hilbertIndex(pts[k][0], pts[k][1], minX, minY, maxX, maxY)
  })).sort((a, b2) => a.d - b2.d).map((e) => e.item);
}
function parseColor(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.trim();
  if (s[0] === "#") {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        1
      ];
    }
    if (hex.length === 6 || hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      ];
    }
    return null;
  }
  const m2 = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m2) {
    const parts = m2[1].split(",").map((p2) => parseFloat(p2));
    if (parts.length < 3 || parts.some((v2) => !isFinite(v2))) return null;
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  return null;
}
function makeColorLerp(from, to) {
  const a = parseColor(from);
  const b2 = parseColor(to);
  if (!a || !b2) return null;
  return (t) => {
    const r = Math.round(a[0] + (b2[0] - a[0]) * t);
    const g2 = Math.round(a[1] + (b2[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b2[2] - a[2]) * t);
    const al = a[3] + (b2[3] - a[3]) * t;
    return al >= 1 ? `rgb(${r},${g2},${bl})` : `rgba(${r},${g2},${bl},${al})`;
  };
}
function easeInOutCubic$1(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function runPieceTween({ pieces, duration, onPieceDone, onAllDone }) {
  let cancelled = false;
  const start = Date.now();
  const dur = Math.max(1, duration);
  const write = (p2, e) => {
    const f = p2.from;
    const t = p2.to;
    const el = p2.el;
    el.setAttribute("x", String(f.x + (t.x - f.x) * e));
    el.setAttribute("y", String(f.y + (t.y - f.y) * e));
    el.setAttribute("width", String(Math.max(0, f.width + (t.width - f.width) * e)));
    el.setAttribute("height", String(Math.max(0, f.height + (t.height - f.height) * e)));
    el.setAttribute("rx", String(Math.max(0, f.rx + (t.rx - f.rx) * e)));
    if (p2.fill) el.setAttribute("fill", p2.fill(e));
    else if (e >= 1 && p2.fillEnd) el.setAttribute("fill", p2.fillEnd);
  };
  const frame = () => {
    if (cancelled) return;
    const elapsed = Date.now() - start;
    let live = false;
    for (let k = 0; k < pieces.length; k++) {
      const p2 = pieces[k];
      if (
        /** @type {any} */
        p2._done
      ) continue;
      const raw = (elapsed - p2.delay) / dur;
      if (raw < 1) live = true;
      if (raw <= 0) continue;
      const t = Math.min(1, raw);
      write(p2, easeInOutCubic$1(t));
      if (t >= 1) {
        p2._done = true;
        if (onPieceDone) onPieceDone(p2);
      }
    }
    if (live) BrowserAPIs.requestAnimationFrame(frame);
    else if (onAllDone) onAllDone();
  };
  BrowserAPIs.requestAnimationFrame(frame);
  return () => {
    cancelled = true;
  };
}
const BAR_FAMILY = /* @__PURE__ */ new Set(["bar", "funnel", "pyramid", "histogram"]);
const RADIAL_FAMILY = /* @__PURE__ */ new Set(["pie", "donut", "polarArea", "radialBar", "gauge"]);
const UNIT_FAMILY = /* @__PURE__ */ new Set(["unit", "waffle"]);
const PARTITION_FAMILY = /* @__PURE__ */ new Set(["treemap", "sunburst"]);
const SUMMARY_FAMILY = /* @__PURE__ */ new Set(["boxPlot", "violin"]);
const GHOST_FADE_FRACTION = 0.55;
const PIECE_BUDGET = 1500;
const PIECE_STAGGER_MAX = 300;
function familyOf(type) {
  if (BAR_FAMILY.has(type)) return "bar";
  if (RADIAL_FAMILY.has(type)) return "radial";
  if (UNIT_FAMILY.has(type)) return "unit";
  if (PARTITION_FAMILY.has(type)) return "partition";
  if (SUMMARY_FAMILY.has(type)) return "summary";
  return null;
}
class MorphTypeChange {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    this._snapshot = null;
    this._ghost = null;
    this._pieceLayer = null;
    this._pieceCancel = null;
  }
  /**
   * @param {string} fromType
   * @param {string} toType
   * @returns {boolean}
   */
  canMorphTypes(fromType, toType) {
    if (fromType === toType) return false;
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    if (!ff || !tf) return false;
    if (ff === "partition" !== (tf === "partition")) {
      return ff !== "unit" && tf !== "unit";
    }
    return true;
  }
  /**
   * @param {string} fromType
   * @param {string} toType
   * @param {any} newSeries
   * @returns {boolean}
   */
  isCompatibleSeriesShape(fromType, toType, newSeries) {
    if (!Array.isArray(newSeries) || newSeries.length === 0) return false;
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    if (tf === "unit") {
      if (newSeries.every((v2) => typeof v2 === "number")) return true;
      return newSeries.every(
        (s) => s && typeof s === "object" && Array.isArray(s.data)
      );
    }
    if (tf === "partition") {
      return true;
    }
    if (tf === "radial") {
      if (newSeries.every((v2) => typeof v2 === "number")) return true;
      return newSeries.length === 1 && newSeries[0] && typeof newSeries[0] === "object" && Array.isArray(newSeries[0].data);
    }
    if (tf === "bar" || tf === "summary") {
      return newSeries.every(
        (s) => s && typeof s === "object" && Array.isArray(s.data)
      );
    }
    return ff !== null && tf !== null;
  }
  /**
   * Capture the live DOM of the *current* (outgoing) chart and stash it on
   * this module. Called from `apexcharts._updateOptions` before the config
   * merge that flips `chart.type`.
   *
   * Returns true if a morph is queued — caller doesn't need the value, but
   * tests use it.
   *
   * @param {{ fromType: string, toType: string, newSeries: any }} args
   * @returns {boolean}
   */
  captureBeforeDestroy({ fromType, toType, newSeries }) {
    this._snapshot = null;
    this._removeGhost();
    this._cancelPieces();
    if (!Environment.isBrowser()) return false;
    const animCfg = this.w.config.chart.animations;
    if (!animCfg || animCfg.enabled === false) return false;
    if (animCfg.chartTypeMorph && animCfg.chartTypeMorph.enabled === false)
      return false;
    if (animCfg.respectReducedMotion && prefersReducedMotion()) return false;
    if (!this.canMorphTypes(fromType, toType)) return false;
    if (!this.isCompatibleSeriesShape(fromType, toType, newSeries)) return false;
    const { marks, branches, unitDots } = this._captureFromDOM(fromType);
    if (!marks.length) return false;
    const mapping = this._buildMapping(
      marks,
      fromType,
      toType,
      newSeries,
      branches
    );
    if (mapping.size === 0) return false;
    this._snapshot = {
      fromType,
      toType,
      mapping,
      oldLayout: {
        translateX: this.w.layout.translateX || 0,
        translateY: this.w.layout.translateY || 0
      }
    };
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    const canShape = this._canProbePaths();
    const pieceFamilies = ff === "bar" || ff === "summary" || ff === "radial" && canShape;
    if (tf === "unit" && pieceFamilies) {
      const total = this._countUnitSeries(newSeries);
      this._snapshot.pieceOut = total > 0 && total <= PIECE_BUDGET;
    } else if (ff === "unit" && (tf === "bar" || tf === "summary" || tf === "radial" && canShape)) {
      let total = 0;
      unitDots.forEach((list) => {
        total += list.length;
      });
      if (total > 0 && total <= PIECE_BUDGET) {
        this._snapshot.pieceIn = true;
        this._snapshot.sourceDots = unitDots;
        const keyOrder = [];
        if (tf === "radial") {
          (Array.isArray(newSeries) ? newSeries : []).forEach(
            (_v, i) => {
              keyOrder.push(`${i}:0`);
            }
          );
        } else {
          (Array.isArray(newSeries) ? newSeries : []).forEach(
            (s, seriesIdx) => {
              const data = s && Array.isArray(s.data) ? s.data : [];
              for (let j = 0; j < data.length; j++) {
                keyOrder.push(`${seriesIdx}:${j}`);
              }
            }
          );
        }
        this._snapshot.keyOrder = keyOrder;
      }
    }
    if (this._needsGhost(fromType, toType) && !this._snapshot.pieceOut && !this._snapshot.pieceIn) {
      this._captureGhost();
    }
    this.w.globals.previousPaths = [];
    return true;
  }
  /**
   * Whether the outgoing marks need an exit animation of their own.
   *
   * Most pairs do not. bar → pie hands every wedge the exact `d` of the bar it
   * replaces, and treemap → sunburst does the same for its tiles: the outgoing
   * mark IS the incoming mark's first frame, so it never needs to leave, and
   * drawing a copy of it would only double the image at t=0.
   *
   * The unit pairs are the exception, in both directions, because the
   * correspondence is not 1:1. Going in, one bar becomes N dots, so the bar has
   * no successor to become. Coming out, N dots become one bar: the bar does
   * grow from the cloud's footprint, but no individual dot has anywhere to go.
   * Either way something on screen simply stops existing, which is exactly the
   * hard cut that made these pairs read as "the old chart vanished and the new
   * one animated" rather than as a morph.
   *
   * @param {string} fromType
   * @param {string} toType
   * @returns {boolean}
   */
  _needsGhost(fromType, toType) {
    return familyOf(fromType) === "unit" || familyOf(toType) === "unit";
  }
  /**
   * Take a detached copy of the outgoing chart's marks, to be mounted over the
   * incoming chart once it exists (see `_mountGhost`).
   *
   * The whole `<svg>` is cloned and the chrome then removed from the copy,
   * rather than lifting the series groups out on their own: every mark's
   * position depends on the transforms of the groups above it, and cloning
   * from the root is what keeps those intact without re-deriving any geometry.
   *
   * The chrome is dropped because `applyChromeFade` already fades the incoming
   * axes, grid and legend in from zero. Keeping the outgoing set as well would
   * put two sets of axis labels on screen at half opacity each.
   */
  _captureGhost() {
    var _a, _b;
    const paper = (_a = this.w.dom) == null ? void 0 : _a.Paper;
    const node = paper && paper.node;
    if (!node || typeof node.cloneNode !== "function") return;
    const clone = node.cloneNode(true);
    const drop = [
      ".apexcharts-xaxis",
      ".apexcharts-yaxis",
      ".apexcharts-grid",
      ".apexcharts-gridlines-horizontal",
      ".apexcharts-gridlines-vertical",
      ".apexcharts-legend",
      ".apexcharts-title-text",
      ".apexcharts-subtitle-text",
      ".apexcharts-annotations",
      ".apexcharts-zoom-rect",
      ".apexcharts-selection-rect",
      ".apexcharts-xcrosshairs",
      ".apexcharts-ycrosshairs"
    ];
    if (typeof clone.querySelectorAll === "function") {
      drop.forEach((sel) => {
        clone.querySelectorAll(sel).forEach((el) => {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
      });
    }
    if (typeof clone.querySelectorAll === "function") {
      clone.querySelectorAll("[id]").forEach((el) => {
        el.removeAttribute("id");
      });
    }
    (_b = clone.removeAttribute) == null ? void 0 : _b.call(clone, "id");
    this._ghost = clone;
  }
  /**
   * Mount the captured copy over the newly-rendered chart and fade it out.
   *
   * It goes ON TOP of the live svg, which is what makes both directions read
   * as one motion rather than as a swap. Going into a unit chart the bars
   * dissolve and the dots are uncovered already in flight, having left from
   * inside the bar that held them. Coming out of one, the dots are still there
   * to fade while the bar grows underneath them; behind the incoming mark they
   * would be hidden on the first frame, because that mark starts out exactly
   * the size of the cloud it is replacing.
   *
   * The fade runs over a fraction of the morph so the outgoing marks are gone
   * before the incoming ones settle. Holding them for the full duration leaves
   * two charts overlapping right at the moment the eye is reading the final
   * shape, which looks like a rendering fault rather than a transition.
   */
  _mountGhost() {
    var _a, _b, _c;
    const ghost = this._ghost;
    if (!ghost || !Environment.isBrowser()) return;
    const wrap = (_a = this.w.dom) == null ? void 0 : _a.elWrap;
    if (!wrap || typeof wrap.appendChild !== "function") {
      this._ghost = null;
      return;
    }
    const style = ghost.style;
    if (style) {
      style.position = "absolute";
      style.left = "0";
      style.top = "0";
      style.background = "transparent";
      style.pointerEvents = "none";
      style.opacity = "1";
    }
    (_b = ghost.setAttribute) == null ? void 0 : _b.call(ghost, "aria-hidden", "true");
    (_c = ghost.setAttribute) == null ? void 0 : _c.call(ghost, "class", "apexcharts-morph-ghost");
    wrap.appendChild(ghost);
    const speed = this.getSpeed();
    const fade = Math.max(120, Math.round(speed * GHOST_FADE_FRACTION));
    BrowserAPIs.requestAnimationFrame(() => {
      if (!style) return;
      style.transition = `opacity ${fade}ms ease-in`;
      style.opacity = "0";
    });
    setTimeout(() => this._removeGhost(), fade + 60);
  }
  /** Detach the ghost if one is mounted. Safe to call at any time. */
  _removeGhost() {
    const ghost = this._ghost;
    this._ghost = null;
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
  }
  /* ------------------------------------------------------------------ *
   * The piece layer (see MorphPieces for the geometry).
   * ------------------------------------------------------------------ */
  /**
   * Object count of an incoming unit series: one datum per dot in the object
   * form. The numeric form ([3, 5]) scales values by `plotOptions.unit
   * .unitValue`, which is not resolvable pre-merge, so it counts as zero and
   * keeps the burst-and-ghost behaviour.
   *
   * @param {any} newSeries
   * @returns {number}
   */
  _countUnitSeries(newSeries) {
    if (!Array.isArray(newSeries)) return 0;
    let total = 0;
    for (const s of newSeries) {
      if (!s || typeof s !== "object" || !Array.isArray(s.data)) return 0;
      total += s.data.length;
    }
    return total;
  }
  /**
   * Whether the incoming unit chart should hold its dots for the piece layer:
   * render them at their final slots, hidden, and let the pieces do the
   * flying. The reveal happens per dot as its piece lands.
   *
   * Consulted by the unit renderer during its draw, which runs after
   * `captureBeforeDestroy` and before `applyChromeFade`, so the decision was
   * already made from the same series the renderer is now drawing.
   *
   * @returns {boolean}
   */
  usesPieceTakeover() {
    return !!(this._snapshot && this._snapshot.pieceOut);
  }
  /**
   * Whether the piece layer claims the incoming mark at (realIndex, j): a
   * source cluster's dots will fly to it and tile it, so it must render
   * hidden and reveal only when its mosaic is complete. Consulted by the bar
   * renderer (boxPlot and violin render through it).
   *
   * @param {number|string} realIndex
   * @param {number|string} j
   * @returns {boolean}
   */
  claimsTargetMark(realIndex, j) {
    return !!(this._snapshot && this._snapshot.pieceIn && this._snapshot.mapping.has(`${realIndex}:${j}`));
  }
  /**
   * Create the overlay group the pieces are driven in. It lives INSIDE the
   * new chart's elGraphical so every coordinate matches the marks' own local
   * space, and it never takes a pointer event.
   * @returns {any} the <g> node, or null
   */
  _makePieceLayer() {
    var _a, _b;
    const graph = (_a = this.w.dom) == null ? void 0 : _a.elGraphical;
    const host = graph && graph.node;
    if (!host || typeof host.appendChild !== "function") return null;
    const g2 = BrowserAPIs.createElementNS("http://www.w3.org/2000/svg", "g");
    if (!g2) return null;
    g2.setAttribute("class", "apexcharts-morph-pieces");
    g2.setAttribute("pointer-events", "none");
    const cuid = (_b = this.w.globals) == null ? void 0 : _b.cuid;
    if (cuid) g2.setAttribute("clip-path", `url(#gridRectBarMask${cuid})`);
    host.appendChild(g2);
    this._pieceLayer = g2;
    return g2;
  }
  /**
   * Reveal everything a piece takeover hid, whether or not the pieces ran.
   * The attribute is plain (no namespace colon) so it stays selectable
   * everywhere.
   */
  _revealPieceHidden() {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl || typeof baseEl.querySelectorAll !== "function") return;
    baseEl.querySelectorAll("[data-piece-hidden]").forEach(
      (el) => {
        el.removeAttribute("opacity");
        el.removeAttribute("data-piece-hidden");
      }
    );
  }
  /** Stop the piece run, drop the overlay, and reveal anything still hidden. */
  _cancelPieces() {
    if (this._pieceCancel) {
      this._pieceCancel();
      this._pieceCancel = null;
    }
    const layer = this._pieceLayer;
    this._pieceLayer = null;
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    this._revealPieceHidden();
  }
  /**
   * Whether this environment can hit-test path geometry at all. Decided
   * before the ghost clone is taken, because a family whose cells are only
   * honest when probed (radial) must keep the fade rather than fall back to a
   * rectangular grid it cannot justify. jsdom answers no.
   * @returns {boolean}
   */
  _canProbePaths() {
    if (!Environment.isBrowser()) return false;
    const probe = BrowserAPIs.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    return !!probe && typeof /** @type {any} */
    probe.isPointInFill === "function";
  }
  /**
   * A per-band ink prober over a mark's path, for gridDivideShape: given a
   * major-axis band it measures where the mark actually has ink across the
   * minor axis, so a violin's cells follow its density outline, a boxPlot's
   * whisker rows collapse to slivers, and a wedge's rows stop at the wedge
   * instead of spanning the bounding box (which stamped a rectangle over the
   * mark at frame one).
   *
   * The probe path is mounted (hidden) inside the piece layer so its user
   * space is exactly the space the cells are laid out in. The stroke test
   * catches zero-area subpaths (a boxPlot's whisker line has no fill to
   * hit), and its width is what a whisker's slivers will measure.
   *
   * Returns null when the environment cannot hit-test path geometry (jsdom);
   * the caller then keeps the plain grid.
   *
   * @param {string} d - path data, in piece-layer coordinates
   * @param {{x:number,y:number,width:number,height:number}} bbox
   * @param {any} layer - the mounted piece layer
   * @returns {{ intervalsAt: (bandLo: number, bandHi: number, horizontal: boolean) => Array<[number, number]> | null, dispose: () => void } | null}
   */
  _makeExtentProber(d, bbox, layer) {
    const doc = layer.ownerDocument;
    const probe = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    probe.setAttribute("d", d);
    probe.setAttribute("fill", "#000");
    probe.setAttribute("stroke", "#000");
    probe.setAttribute("stroke-width", "3");
    probe.setAttribute("visibility", "hidden");
    layer.appendChild(probe);
    const svg = probe.ownerSVGElement;
    if (typeof /** @type {any} */
    probe.isPointInFill !== "function" || !svg || typeof svg.createSVGPoint !== "function") {
      layer.removeChild(probe);
      return null;
    }
    const pt = svg.createSVGPoint();
    const hit = (x, y) => {
      pt.x = x;
      pt.y = y;
      const p2 = (
        /** @type {any} */
        probe
      );
      return p2.isPointInFill(pt) || typeof p2.isPointInStroke === "function" && p2.isPointInStroke(pt);
    };
    const SCAN = 48;
    const intervalsAt = (bandLo, bandHi, horizontal) => {
      const lo = horizontal ? bbox.y : bbox.x;
      const hi = lo + (horizontal ? bbox.height : bbox.width);
      if (!(hi > lo)) return null;
      const at = (v2, major) => horizontal ? hit(major, v2) : hit(v2, major);
      const majors = [
        bandLo + (bandHi - bandLo) * 0.1,
        (bandLo + bandHi) / 2,
        bandHi - (bandHi - bandLo) * 0.1
      ];
      const edge = (inside, outside, major) => {
        let a = outside;
        let b2 = inside;
        for (let it = 0; it < 6; it++) {
          const m2 = (a + b2) / 2;
          if (at(m2, major)) b2 = m2;
          else a = m2;
        }
        return (a + b2) / 2;
      };
      const step = (hi - lo) / SCAN;
      const proof = new Array(SCAN + 1).fill(null);
      let any = false;
      for (const major of majors) {
        for (let s = 0; s <= SCAN; s++) {
          if (proof[s] !== null) continue;
          if (at(lo + s * step, major)) {
            proof[s] = major;
            any = true;
          }
        }
      }
      if (!any) return null;
      const out = [];
      let runStart = -1;
      for (let s = 0; s <= SCAN + 1; s++) {
        const inside = s <= SCAN && proof[s] !== null;
        if (inside && runStart < 0) runStart = s;
        if (!inside && runStart >= 0) {
          const last = s - 1;
          const major = (
            /** @type {number} */
            proof[runStart]
          );
          const left = runStart === 0 ? lo : edge(lo + runStart * step, lo + (runStart - 1) * step, major);
          const right = last === SCAN ? hi : edge(
            lo + last * step,
            lo + (last + 1) * step,
            /** @type {number} */
            proof[last]
          );
          if (right > left) out.push([left, right]);
          runStart = -1;
        }
      }
      return out.length ? out : null;
    };
    return {
      intervalsAt,
      dispose: () => {
        if (probe.parentNode) probe.parentNode.removeChild(probe);
      }
    };
  }
  /**
   * mark -> objects. Cut each captured mark into one cell per dot and fly
   * every cell to its dot, corners rounding off and fill blending on the way.
   * The real dots (rendered hidden by the unit chart, see usesPieceTakeover)
   * are revealed one by one as their piece lands, so the handoff is
   * geometrically exact and nothing ever fades.
   */
  _separatePieces() {
    var _a;
    const snap = this._snapshot;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!snap || !baseEl) return this._revealPieceHidden();
    const byCluster = /* @__PURE__ */ new Map();
    let total = 0;
    baseEl.querySelectorAll(".apexcharts-unit-area").forEach((dot) => {
      var _a2, _b, _c, _d, _e, _f, _g;
      const i = parseInt((_a2 = dot.getAttribute("i")) != null ? _a2 : "", 10);
      if (isNaN(i)) return;
      const cxAttr = dot.getAttribute("cx");
      let x;
      let y;
      let r = 3;
      if (cxAttr != null) {
        x = parseFloat(cxAttr);
        y = parseFloat((_b = dot.getAttribute("cy")) != null ? _b : "");
        r = parseFloat((_c = dot.getAttribute("r")) != null ? _c : "3") || 3;
      } else {
        const wAttr = parseFloat((_d = dot.getAttribute("width")) != null ? _d : "0") || 0;
        const hAttr = parseFloat((_e = dot.getAttribute("height")) != null ? _e : "0") || 0;
        x = parseFloat((_f = dot.getAttribute("x")) != null ? _f : "") + wAttr / 2;
        y = parseFloat((_g = dot.getAttribute("y")) != null ? _g : "") + hAttr / 2;
        r = Math.max(wAttr, hAttr) / 2 || 3;
      }
      if (!isFinite(x) || !isFinite(y)) return;
      let list = byCluster.get(i);
      if (!list) {
        list = [];
        byCluster.set(i, list);
      }
      list.push({ el: dot, x, y, r, fill: dot.getAttribute("fill") });
      total++;
    });
    if (total === 0 || total > PIECE_BUDGET) return this._revealPieceHidden();
    const layer = this._makePieceLayer();
    if (!layer) return this._revealPieceHidden();
    const pieces = [];
    const doc = layer.ownerDocument;
    const sourceFam = familyOf(snap.fromType);
    const shapedSource = sourceFam === "summary" || sourceFam === "radial";
    Array.from(byCluster.keys()).sort((a, b2) => a - b2).forEach((i) => {
      var _a2;
      const dots = (
        /** @type {any[]} */
        byCluster.get(i)
      );
      const box = this.getInitialBBoxFor(i);
      const entry = snap.mapping.get(`${i}:0`);
      if (!box || !entry) {
        dots.forEach((d) => {
          d.el.removeAttribute("opacity");
          d.el.removeAttribute("data-piece-hidden");
        });
        return;
      }
      const markFill = entry.fill && entry.fill.indexOf("url(") !== 0 ? entry.fill : ((_a2 = this.w.globals.colors) == null ? void 0 : _a2[i]) || dots[0].fill;
      let prober = null;
      if (shapedSource) {
        const shifted = this.getInitialPathFor(i, 0);
        if (shifted) prober = this._makeExtentProber(shifted, box, layer);
      }
      const divided = prober ? gridDivideShape(box, dots.length, prober.intervalsAt) : gridDivideRect(box, dots.length);
      if (prober) prober.dispose();
      const cells = sortByHilbert(divided, (c) => [
        c.x + c.width / 2,
        c.y + c.height / 2
      ]);
      const ordered = sortByHilbert(dots, (d) => [d.x, d.y]);
      for (let k = 0; k < ordered.length; k++) {
        const cell = cells[k];
        const dot = ordered[k];
        const el = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
        el.setAttribute("data-i", String(i));
        el.setAttribute("x", String(cell.x));
        el.setAttribute("y", String(cell.y));
        el.setAttribute("width", String(cell.width));
        el.setAttribute("height", String(cell.height));
        el.setAttribute("rx", "0");
        el.setAttribute("fill", String(markFill));
        layer.appendChild(el);
        pieces.push({
          el,
          from: { x: cell.x, y: cell.y, width: cell.width, height: cell.height, rx: 0 },
          to: {
            x: dot.x - dot.r,
            y: dot.y - dot.r,
            width: dot.r * 2,
            height: dot.r * 2,
            rx: dot.r
          },
          fill: makeColorLerp(markFill, dot.fill),
          fillEnd: dot.fill,
          delay: 0,
          meta: { dotEl: dot.el }
        });
      }
    });
    if (!pieces.length) return this._cancelPieces();
    this._runPieces(pieces, (piece) => {
      const dotEl = piece.meta.dotEl;
      dotEl.removeAttribute("opacity");
      dotEl.removeAttribute("data-piece-hidden");
      if (piece.el.parentNode) piece.el.parentNode.removeChild(piece.el);
    });
  }
  /**
   * objects -> mark. Each captured outgoing dot flies to one cell of the
   * incoming mark, squaring off and blending towards the mark's fill; the
   * mark itself (rendered hidden, see claimsTargetMark) is revealed the
   * moment its last piece lands and the mosaic is complete, which is also the
   * moment the seams disappear.
   */
  _combinePieces() {
    var _a, _b;
    const snap = this._snapshot;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!snap || !snap.sourceDots || !snap.keyOrder || !baseEl) {
      return this._revealPieceHidden();
    }
    const targets = this._collectTargetMarks(snap.toType);
    if (!targets.size) return this._revealPieceHidden();
    const dx = snap.oldLayout.translateX - (this.w.layout.translateX || 0);
    const dy = snap.oldLayout.translateY - (this.w.layout.translateY || 0);
    const clusterIdx = Array.from(snap.sourceDots.keys()).sort((a, b2) => a - b2);
    const layer = this._makePieceLayer();
    if (!layer) return this._revealPieceHidden();
    const doc = layer.ownerDocument;
    const pieces = [];
    const targetFam = familyOf(snap.toType);
    const shapedTarget = targetFam === "summary" || targetFam === "radial";
    for (let k = 0; k < clusterIdx.length; k++) {
      const dots = (
        /** @type {any[]} */
        snap.sourceDots.get(clusterIdx[k])
      );
      const key = snap.keyOrder[k];
      const target = key ? targets.get(key) : null;
      if (!target || !dots || !dots.length) {
        if (target) {
          target.els.forEach((el) => {
            el.removeAttribute("opacity");
            el.removeAttribute("data-piece-hidden");
          });
        }
        continue;
      }
      const markFill = target.fill && target.fill.indexOf("url(") !== 0 ? target.fill : ((_b = this.w.globals.colors) == null ? void 0 : _b[target.realIndex]) || dots[0].fill;
      let prober = null;
      if (shapedTarget) {
        const d = target.d || target.els.map(
          (p2) => p2.getAttribute("pathTo") || p2.getAttribute("d")
        ).filter(Boolean).join(" ");
        if (d) prober = this._makeExtentProber(d, target.bbox, layer);
      }
      const divided = prober ? gridDivideShape(target.bbox, dots.length, prober.intervalsAt) : gridDivideRect(target.bbox, dots.length);
      if (prober) prober.dispose();
      const cells = sortByHilbert(divided, (c) => [
        c.x + c.width / 2,
        c.y + c.height / 2
      ]);
      const ordered = sortByHilbert(dots, (d) => [d.x, d.y]);
      const markState = { remaining: ordered.length, els: target.els, tiles: (
        /** @type {any[]} */
        []
      ) };
      for (let m2 = 0; m2 < ordered.length; m2++) {
        const dot = ordered[m2];
        const cell = cells[m2];
        const el = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
        const fx = dot.x + dx - dot.r;
        const fy = dot.y + dy - dot.r;
        el.setAttribute("data-key", key);
        el.setAttribute("x", String(fx));
        el.setAttribute("y", String(fy));
        el.setAttribute("width", String(dot.r * 2));
        el.setAttribute("height", String(dot.r * 2));
        el.setAttribute("rx", String(dot.r));
        el.setAttribute("fill", String(dot.fill || markFill));
        layer.appendChild(el);
        markState.tiles.push(el);
        pieces.push({
          el,
          from: { x: fx, y: fy, width: dot.r * 2, height: dot.r * 2, rx: dot.r },
          to: { x: cell.x, y: cell.y, width: cell.width, height: cell.height, rx: 0 },
          fill: makeColorLerp(dot.fill, markFill),
          fillEnd: String(markFill),
          delay: 0,
          meta: { markState }
        });
      }
    }
    if (!pieces.length) return this._cancelPieces();
    this._runPieces(pieces, (piece) => {
      const state = piece.meta.markState;
      state.remaining--;
      if (state.remaining === 0) {
        state.els.forEach((el) => {
          el.removeAttribute("opacity");
          el.removeAttribute("data-piece-hidden");
        });
        state.tiles.forEach((t) => {
          if (t.parentNode) t.parentNode.removeChild(t);
        });
      }
    });
  }
  /**
   * Stagger and start a piece run. Delays sweep the (already spatially
   * sorted) list front to back, and the last piece still lands within the
   * configured morph speed.
   *
   * @param {import('./MorphPieces').Piece[]} pieces
   * @param {(piece: import('./MorphPieces').Piece) => void} onPieceDone
   */
  _runPieces(pieces, onPieceDone) {
    const speed = this.getSpeed();
    const stagger = Math.min(PIECE_STAGGER_MAX, speed * 0.35);
    const flight = Math.max(180, speed - stagger);
    for (let k = 0; k < pieces.length; k++) {
      pieces[k].delay = pieces.length > 1 ? k / (pieces.length - 1) * stagger : 0;
    }
    this._pieceCancel = runPieceTween({
      pieces,
      duration: flight,
      onPieceDone,
      onAllDone: () => {
        this._pieceCancel = null;
        this._cancelPieces();
      }
    });
  }
  /**
   * The incoming chart's marks, read live: every `path[pathTo]` grouped into
   * one mark per (realIndex, j), with the union bbox of its final geometry.
   * Bar marks are one path each; summary marks (boxPlot, violin) may be
   * several, walked exactly like the capture branch walks the outgoing ones.
   *
   * @param {string} toType
   * @returns {Map<string, { realIndex: number, j: number, bbox: {x:number,y:number,width:number,height:number}, fill: string|null, els: any[], d?: string }>}
   */
  _collectTargetMarks(toType) {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    const out = /* @__PURE__ */ new Map();
    if (!baseEl) return out;
    const fam = familyOf(toType);
    if (fam === "radial") {
      baseEl.querySelectorAll(".apexcharts-pie-series .apexcharts-pie-area").forEach((p2, i) => {
        const d = p2.getAttribute("data:pathFinal") || p2.getAttribute("d");
        if (!d || !d.trim()) return;
        const box = this._pathBBox(d);
        if (!box) return;
        out.set(`${i}:0`, {
          realIndex: i,
          j: 0,
          d,
          bbox: {
            x: box.minX,
            y: box.minY,
            width: box.maxX - box.minX,
            height: box.maxY - box.minY
          },
          fill: p2.getAttribute("fill"),
          els: [p2]
        });
      });
      return out;
    }
    const wrapClass = fam === "summary" ? `.apexcharts-${toType}-series` : ".apexcharts-bar-series";
    baseEl.querySelectorAll(`${wrapClass} .apexcharts-series`).forEach((group) => {
      var _a2;
      const realIndex = parseInt((_a2 = group.getAttribute("data:realIndex")) != null ? _a2 : "0", 10) || 0;
      let order = 0;
      group.querySelectorAll("path[pathTo]").forEach((p2) => {
        var _a3;
        const d = p2.getAttribute("pathTo") || p2.getAttribute("d");
        if (!d || !d.trim()) return;
        const jAttr = parseInt((_a3 = p2.getAttribute("j")) != null ? _a3 : "", 10);
        const j = isNaN(jAttr) ? order++ : jAttr;
        const box = this._pathBBox(d);
        if (!box) return;
        const key = `${realIndex}:${j}`;
        const prev = out.get(key);
        if (prev) {
          prev.els.push(p2);
          prev.bbox = {
            x: Math.min(prev.bbox.x, box.minX),
            y: Math.min(prev.bbox.y, box.minY),
            width: Math.max(prev.bbox.x + prev.bbox.width, box.maxX) - Math.min(prev.bbox.x, box.minX),
            height: Math.max(prev.bbox.y + prev.bbox.height, box.maxY) - Math.min(prev.bbox.y, box.minY)
          };
        } else {
          out.set(key, {
            realIndex,
            j,
            bbox: {
              x: box.minX,
              y: box.minY,
              width: box.maxX - box.minX,
              height: box.maxY - box.minY
            },
            fill: p2.getAttribute("fill"),
            els: [p2]
          });
        }
      });
    });
    return out;
  }
  /**
   * Walk the outgoing chart's DOM and collect path `d` strings keyed by
   * (realIndex, j). The selectors are scoped to the chart family — bar
   * elements have `pathTo` set; pie/radial elements use their final `d`.
   *
   * @param {string} fromType
   * @returns {{ marks: Array<{ realIndex: number, j: number, d: string, fill: string|null, key?: string|null }>, branches: Array<{ key: string, d: string, fill: string|null }>, unitDots: Map<number, Array<{x:number,y:number,r:number,fill:string|null}>> }}
   */
  _captureFromDOM(fromType) {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl) return { marks: [], branches: [], unitDots: /* @__PURE__ */ new Map() };
    const captured = [];
    const branches = [];
    const unitDots = /* @__PURE__ */ new Map();
    const fam = familyOf(fromType);
    if (fam === "bar") {
      const seriesNodes = baseEl.querySelectorAll(
        ".apexcharts-bar-series .apexcharts-series"
      );
      seriesNodes.forEach((seriesNode) => {
        var _a2;
        const realIndex = parseInt(
          (_a2 = seriesNode.getAttribute("data:realIndex")) != null ? _a2 : "0",
          10
        );
        const paths = seriesNode.querySelectorAll("path[pathTo]");
        paths.forEach((p2, j) => {
          const d = p2.getAttribute("pathTo") || p2.getAttribute("d");
          if (!d) return;
          captured.push({
            realIndex,
            j,
            d,
            fill: p2.getAttribute("fill")
          });
        });
      });
    } else if (fam === "summary") {
      const byMark = /* @__PURE__ */ new Map();
      baseEl.querySelectorAll(`.apexcharts-${fromType}-area`).forEach((p2) => {
        var _a2, _b;
        const j = parseInt((_a2 = p2.getAttribute("j")) != null ? _a2 : "", 10);
        if (isNaN(j)) return;
        const d = p2.getAttribute("pathTo") || p2.getAttribute("d");
        if (!d || !d.trim()) return;
        const group = typeof p2.closest === "function" ? p2.closest(".apexcharts-series") : null;
        const realIndex = parseInt((_b = group == null ? void 0 : group.getAttribute("data:realIndex")) != null ? _b : "0", 10) || 0;
        const key = `${realIndex}:${j}`;
        const prev = byMark.get(key);
        if (prev) prev.d += ` ${d}`;
        else byMark.set(key, { realIndex, j, d, fill: p2.getAttribute("fill") });
      });
      Array.from(byMark.values()).sort((a, b2) => a.realIndex - b2.realIndex || a.j - b2.j).forEach((m2) => captured.push(m2));
    } else if (fam === "partition") {
      if (fromType === "treemap") {
        const rectPath = (el) => {
          var _a2, _b, _c, _d;
          const x = parseFloat((_a2 = el.getAttribute("x")) != null ? _a2 : "");
          const y = parseFloat((_b = el.getAttribute("y")) != null ? _b : "");
          const width = parseFloat((_c = el.getAttribute("width")) != null ? _c : "");
          const height = parseFloat((_d = el.getAttribute("height")) != null ? _d : "");
          if (![x, y, width, height].every((v2) => isFinite(v2))) return null;
          return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
        };
        const tiles = baseEl.querySelectorAll(".apexcharts-treemap-rect");
        tiles.forEach((t) => {
          var _a2, _b;
          const d = rectPath(t);
          if (!d) return;
          captured.push({
            realIndex: parseInt((_a2 = t.getAttribute("i")) != null ? _a2 : "0", 10) || 0,
            j: parseInt((_b = t.getAttribute("j")) != null ? _b : "0", 10) || 0,
            d,
            fill: t.getAttribute("fill"),
            key: t.getAttribute("data:key") || null
          });
        });
        const containers = baseEl.querySelectorAll(
          ".apexcharts-treemap-parent-rect"
        );
        containers.forEach((c) => {
          const d = rectPath(c);
          const key = c.getAttribute("data:key");
          if (!d || !key) return;
          branches.push({ key, d, fill: c.getAttribute("fill") });
        });
      } else {
        const arcs = baseEl.querySelectorAll(".apexcharts-sunburst-arc");
        const leaves = [];
        arcs.forEach((a) => {
          if (a.getAttribute("data:leaf") === "true") leaves.push(a);
        });
        const source = leaves.length ? leaves : Array.from(arcs);
        source.forEach((a, i) => {
          const d = a.getAttribute("d");
          if (!d || !d.trim()) return;
          captured.push({
            realIndex: i,
            j: 0,
            d,
            fill: a.getAttribute("fill"),
            key: a.getAttribute("data:key") || null
          });
        });
        arcs.forEach((a) => {
          if (a.getAttribute("data:leaf") === "true") return;
          const d = a.getAttribute("d");
          const key = a.getAttribute("data:key");
          if (!d || !d.trim() || !key) return;
          branches.push({ key, d, fill: a.getAttribute("fill") });
        });
      }
    } else if (fam === "unit") {
      const dots = baseEl.querySelectorAll(".apexcharts-unit-area");
      const boxes = /* @__PURE__ */ new Map();
      dots.forEach((dot) => {
        var _a2, _b, _c, _d, _e, _f, _g;
        const i = parseInt((_a2 = dot.getAttribute("i")) != null ? _a2 : "", 10);
        if (isNaN(i)) return;
        const cxAttr = dot.getAttribute("cx");
        let x;
        let y;
        let r = 3;
        if (cxAttr != null) {
          x = parseFloat(cxAttr);
          y = parseFloat((_b = dot.getAttribute("cy")) != null ? _b : "");
          r = parseFloat((_c = dot.getAttribute("r")) != null ? _c : "3") || 3;
        } else {
          const wAttr = parseFloat((_d = dot.getAttribute("width")) != null ? _d : "0") || 0;
          const hAttr = parseFloat((_e = dot.getAttribute("height")) != null ? _e : "0") || 0;
          x = parseFloat((_f = dot.getAttribute("x")) != null ? _f : "") + wAttr / 2;
          y = parseFloat((_g = dot.getAttribute("y")) != null ? _g : "") + hAttr / 2;
          r = Math.max(wAttr, hAttr) / 2 || 3;
        }
        if (!isFinite(x) || !isFinite(y)) return;
        let list = unitDots.get(i);
        if (!list) {
          list = [];
          unitDots.set(i, list);
        }
        list.push({ x, y, r, fill: dot.getAttribute("fill") });
        const box = boxes.get(i);
        if (!box) {
          boxes.set(i, {
            minX: x,
            minY: y,
            maxX: x,
            maxY: y,
            fill: dot.getAttribute("fill")
          });
          return;
        }
        if (x < box.minX) box.minX = x;
        if (x > box.maxX) box.maxX = x;
        if (y < box.minY) box.minY = y;
        if (y > box.maxY) box.maxY = y;
      });
      Array.from(boxes.keys()).sort((a, b2) => a - b2).forEach((i) => {
        const b2 = (
          /** @type {any} */
          boxes.get(i)
        );
        const pad = 2;
        const x1 = b2.minX - pad;
        const y1 = b2.minY - pad;
        const x2 = b2.maxX + pad;
        const y2 = b2.maxY + pad;
        captured.push({
          realIndex: i,
          j: 0,
          d: `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`,
          fill: b2.fill
        });
      });
    } else if (fam === "radial") {
      if (fromType === "radialBar" || fromType === "gauge") {
        const centerX = this.w.layout.gridWidth / 2;
        const centerY = Math.min(this.w.layout.gridWidth, this.w.layout.gridHeight) / 2;
        const rings = baseEl.querySelectorAll(
          ".apexcharts-radial-series .apexcharts-radialbar-area"
        );
        rings.forEach((p2) => {
          var _a2;
          const parent = (
            /** @type {Element|null} */
            p2.parentElement
          );
          const realIndex = parseInt(
            (_a2 = parent == null ? void 0 : parent.getAttribute("data:realIndex")) != null ? _a2 : "0",
            10
          );
          const rawD = p2.getAttribute("d");
          if (!rawD) return;
          const strokeWidth = parseFloat(p2.getAttribute("stroke-width") || "0");
          const d = strokeWidth > 1 ? this._radialArcToFilledSegment(
            rawD,
            strokeWidth,
            centerX,
            centerY
          ) || rawD : rawD;
          captured.push({
            realIndex,
            j: 0,
            d,
            fill: p2.getAttribute("stroke")
          });
        });
      } else {
        const slices = baseEl.querySelectorAll(
          ".apexcharts-pie-series .apexcharts-pie-area"
        );
        slices.forEach(
          (p2, i) => {
            const d = p2.getAttribute("d");
            if (!d) return;
            captured.push({
              realIndex: i,
              j: 0,
              d,
              fill: p2.getAttribute("fill")
            });
          }
        );
      }
    }
    return { marks: captured, branches, unitDots };
  }
  /**
   * Convert a radialBar's stroked open-arc `d` ("M x1 y1 A r r 0 large sweep
   * x2 y2") into a closed donut-segment polygon whose FILLED rendering
   * visually matches the original stroked arc — needed because the morph
   * target (pie/donut/polarArea) renders by fill, not stroke. Returns null
   * if the input doesn't match the expected M-then-A shape.
   *
   * @param {string} rawD
   * @param {number} strokeWidth
   * @param {number} centerX
   * @param {number} centerY
   * @returns {string | null}
   */
  _radialArcToFilledSegment(rawD, strokeWidth, centerX, centerY) {
    const m2 = rawD.match(
      /M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+A\s*(-?[\d.]+)\s+(?:-?[\d.]+)\s+(?:-?[\d.]+)\s+(\d)\s+(\d)\s+(-?[\d.]+)\s+(-?[\d.]+)/
    );
    if (!m2) return null;
    const x1 = parseFloat(m2[1]);
    const y1 = parseFloat(m2[2]);
    const r = parseFloat(m2[3]);
    const large = parseInt(m2[4], 10);
    const sweep = parseInt(m2[5], 10);
    const x2 = parseFloat(m2[6]);
    const y2 = parseFloat(m2[7]);
    if (!isFinite(r) || r <= 0) return null;
    const half = strokeWidth / 2;
    const rOuter = r + half;
    const rInner = Math.max(0, r - half);
    const proj = (px, py, newR) => {
      const dx = px - centerX;
      const dy = py - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return { x: centerX, y: centerY };
      const k = newR / dist;
      return { x: centerX + dx * k, y: centerY + dy * k };
    };
    const o1 = proj(x1, y1, rOuter);
    const o2 = proj(x2, y2, rOuter);
    const i1 = proj(x1, y1, rInner);
    const i2 = proj(x2, y2, rInner);
    const sweepBack = sweep ? 0 : 1;
    return `M ${o1.x} ${o1.y} A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${rInner} ${rInner} 0 ${large} ${sweepBack} ${i1.x} ${i1.y} Z`;
  }
  /**
   * Build a closed donut-segment path for the given polar arc geometry. Used
   * by Radial.drawArcs when morphing FROM a filled wedge (pie/donut/polarArea)
   * TO a radialBar arc: the final radialBar is rendered as a stroked open arc,
   * but during the morph we tween d toward this closed-segment form (which
   * looks identical to the stroked arc when filled with the same color) so
   * the in-between frames remain visually consistent filled shapes rather
   * than a thick-outlined wedge.
   *
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} ringRadius - centerline radius of the radialBar ring
   * @param {number} strokeWidth - the ring's stroke thickness
   * @param {number} startAngleDeg - in degrees, 0° = top (12 o'clock)
   * @param {number} endAngleDeg
   * @returns {string}
   */
  buildRingSegmentPath(centerX, centerY, ringRadius, strokeWidth, startAngleDeg, endAngleDeg) {
    const halfStroke = strokeWidth / 2;
    const rOuter = ringRadius + halfStroke;
    const rInner = Math.max(0, ringRadius - halfStroke);
    const sRad = (startAngleDeg - 90) * Math.PI / 180;
    const eRad = (endAngleDeg - 90) * Math.PI / 180;
    const oStart = {
      x: centerX + rOuter * Math.cos(sRad),
      y: centerY + rOuter * Math.sin(sRad)
    };
    const oEnd = {
      x: centerX + rOuter * Math.cos(eRad),
      y: centerY + rOuter * Math.sin(eRad)
    };
    const iStart = {
      x: centerX + rInner * Math.cos(sRad),
      y: centerY + rInner * Math.sin(sRad)
    };
    const iEnd = {
      x: centerX + rInner * Math.cos(eRad),
      y: centerY + rInner * Math.sin(eRad)
    };
    const sweep = endAngleDeg > startAngleDeg ? 1 : 0;
    const large = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
    return `M ${oStart.x} ${oStart.y} A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${oEnd.x} ${oEnd.y} L ${iEnd.x} ${iEnd.y} A ${rInner} ${rInner} 0 ${large} ${1 - sweep} ${iStart.x} ${iStart.y} Z`;
  }
  /**
   * @returns {string | null} the chart-type the active snapshot was captured
   *   from, or null when no morph is in flight.
   */
  getFromType() {
    return this._snapshot ? this._snapshot.fromType : null;
  }
  /**
   * Build a (targetKey → captured) map. The targetKey matches the lookup
   * pattern each chart-type renderer uses when it asks
   * `getInitialPathFor(realIndex, j)`.
   *
   * Strategy: flatten the captured items into a linear sequence (matching the
   * source chart's natural DOM iteration order: series-then-point for bar,
   * ring-by-ring for radial), then walk the target's iteration positions in
   * the same order and pair them up 1:1. This handles every supported shape
   * without per-pair branching:
   *
   *   - bar (1 series, N pts) ↔ radial-family (N items)  → linear[k] ↔ k
   *   - bar (M series, 1 pt)  ↔ radial-family (M items)  → linear[k] ↔ k
   *   - radial-family (N items) ↔ bar (any matching shape) → linear[k] ↔ flat target
   *   - radial-family ↔ radial-family                    → linear[k] ↔ k
   *
   * @param {Array<{ realIndex: number, j: number, d: string, fill: string|null, key?: string|null }>} captured
   * @param {string} _fromType
   * @param {string} toType
   * @param {any} newSeries - the series array being passed to the new chart;
   *   used only to derive the bar target's (realIndex, j) iteration positions.
   * @param {Array<{ key: string, d: string, fill: string|null }>} [branches]
   *   non-leaf marks, for the key-based partition pairing.
   */
  _buildMapping(captured, _fromType, toType, newSeries, branches) {
    const map = /* @__PURE__ */ new Map();
    const tf = familyOf(toType);
    const flat = captured.slice().sort((a, b2) => a.realIndex - b2.realIndex || a.j - b2.j);
    if (tf === "partition" && branches && branches.length) {
      const keyedMarks = flat.filter((c) => c.key);
      if (keyedMarks.length === flat.length) {
        keyedMarks.forEach((c) => {
          map.set(`key:${c.key}`, { d: c.d, fill: c.fill });
        });
        branches.forEach((br) => {
          map.set(`key:${br.key}`, { d: br.d, fill: br.fill });
        });
      }
    }
    if (tf === "radial" || tf === "unit" || tf === "partition") {
      flat.forEach((c, i) => {
        map.set(`${i}:0`, { d: c.d, fill: c.fill });
      });
      return map;
    }
    if (tf === "bar" || tf === "summary") {
      const positions = [];
      const series = Array.isArray(newSeries) ? newSeries : [];
      series.forEach((s, seriesIdx) => {
        const data = s && Array.isArray(s.data) ? s.data : [];
        for (let j = 0; j < data.length; j++) {
          positions.push({ realIndex: seriesIdx, j });
        }
      });
      flat.forEach((c, i) => {
        const pos = positions[i];
        if (pos) {
          map.set(`${pos.realIndex}:${pos.j}`, { d: c.d, fill: c.fill });
        }
      });
      return map;
    }
    return map;
  }
  isActive() {
    return this._snapshot !== null;
  }
  /**
   * @param {number|string} realIndex
   * @param {number|string} j
   * @returns {string | null}
   */
  getInitialPathFor(realIndex, j) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`);
    if (!entry) return null;
    const dx = this._snapshot.oldLayout.translateX - (this.w.layout.translateX || 0);
    const dy = this._snapshot.oldLayout.translateY - (this.w.layout.translateY || 0);
    return dx === 0 && dy === 0 ? entry.d : this._translatePathD(entry.d, dx, dy);
  }
  /**
   * Offset every absolute coordinate in an SVG path `d` by (dx, dy).
   *
   * Assumes the path uses only uppercase (absolute) commands — every path
   * ApexCharts generates does. Relative-command paths would pass through
   * unchanged at the lowercase, which is also semantically correct (deltas
   * don't shift under a parent translate).
   *
   * @param {string} d
   * @param {number} dx
   * @param {number} dy
   * @returns {string}
   */
  _translatePathD(d, dx, dy) {
    if (dx === 0 && dy === 0) return d;
    const commands = parsePath(d);
    return commands.map(
      /** @param {any[]} c */
      (c) => {
        const cmd = c[0];
        if (cmd === "Z") return "Z";
        if (cmd === "M" || cmd === "L" || cmd === "T") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy}`;
        }
        if (cmd === "H") return `${cmd} ${c[1] + dx}`;
        if (cmd === "V") return `${cmd} ${c[1] + dy}`;
        if (cmd === "C") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy} ${c[5] + dx} ${c[6] + dy}`;
        }
        if (cmd === "S" || cmd === "Q") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy}`;
        }
        if (cmd === "A") {
          return `${cmd} ${c[1]} ${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6] + dx} ${c[7] + dy}`;
        }
        return c.join(" ");
      }
    ).join(" ");
  }
  /**
   * The centre point (in the NEW chart's screen space) of the captured shape
   * for cluster `i`. Kept for callers that only need a point; the unit renderer
   * uses getInitialBBoxFor so its dots fill the shape rather than stack on a
   * single point.
   * @param {number} i
   * @returns {{ x: number, y: number } | null}
   */
  getInitialCenterFor(i) {
    const box = this.getInitialBBoxFor(i);
    if (!box) return null;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  /**
   * The `k`-th captured path in draw order, already shifted into the NEW
   * chart's coordinate space.
   *
   * For marks that pair up by position rather than by a (series, point) grid:
   * a treemap's tiles and a sunburst's leaves are each one mark per row, laid
   * out in the same reading order, so the k-th of one becomes the k-th of the
   * other.
   *
   * @param {number} k
   * @returns {string | null}
   */
  getInitialPathAt(k) {
    return this.getInitialPathFor(k, 0);
  }
  /**
   * The captured shape for a branch identity (charts/common/Hierarchy.morphKey),
   * or null when the outgoing chart had no mark for that branch.
   *
   * This is what lets a partition morph pair at every level: a sector, an
   * industry and a company each find the arc or tile that stood for the same
   * branch, instead of leaves pairing by draw order while the containers pop.
   *
   * @param {string} key
   * @returns {string | null}
   */
  getInitialPathForKey(key) {
    if (!this._snapshot || !key) return null;
    return this.getInitialPathFor("key", key);
  }
  /** True when the active snapshot can pair by branch key. */
  hasKeyedMarks() {
    if (!this._snapshot) return false;
    for (const k of this._snapshot.mapping.keys()) {
      if (typeof k === "string" && k.startsWith("key:")) return true;
    }
    return false;
  }
  /**
   * Where the `j`-th of `n` objects in cluster `i` starts, INSIDE the shape it
   * came out of.
   *
   * An aggregate mark stands for a quantity, and its extent is that quantity: a
   * bar of height h representing n units gives its k-th unit the height
   * fraction (k + 0.5)/n. So a bar does not spray its dots from a single point,
   * it comes apart along its own length, bottom-up, and each dot leaves from
   * the part of the bar that was standing for it. The reverse direction reads
   * the same geometry, so explode and collapse are inverses.
   *
   * The distribution follows the captured shape's LONGER axis, which is what
   * makes one function serve both marks: a bar's box is tall and thin, so the
   * dots leave in a column; a wedge's box is squat, so they leave in a row
   * across it.
   *
   * @param {number} i - cluster index
   * @param {number} j - the object's rank within its cluster
   * @param {number} n - objects in the cluster
   * @returns {{ x: number, y: number } | null}
   */
  getInitialSlotFor(i, j, n) {
    const box = this.getInitialBBoxFor(i);
    if (!box) return null;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    if (!(n > 1) || !(j >= 0)) return { x: cx, y: cy };
    const t = (Math.min(j, n - 1) + 0.5) / n;
    if (box.height >= box.width) {
      return { x: cx, y: box.y + box.height * (1 - t) };
    }
    return { x: box.x + box.width * t, y: cy };
  }
  /**
   * The bounding box (in the NEW chart's screen space) of the captured shape
   * for cluster `i`. `getInitialSlotFor` distributes a cluster's objects across
   * this box as their start positions, so a tall bar visibly breaks apart into
   * a tall column of dots that then swarm into the cluster.
   * @param {number} i
   * @returns {{ x: number, y: number, width: number, height: number } | null}
   */
  getInitialBBoxFor(i) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${i}:0`);
    if (!entry) return null;
    const box = this._pathBBox(entry.d);
    if (!box) return null;
    const dx = this._snapshot.oldLayout.translateX - (this.w.layout.translateX || 0);
    const dy = this._snapshot.oldLayout.translateY - (this.w.layout.translateY || 0);
    return {
      x: box.minX + dx,
      y: box.minY + dy,
      width: box.maxX - box.minX,
      height: box.maxY - box.minY
    };
  }
  /**
   * Bounding box of an absolute-command SVG path `d`. Good enough as the burst
   * footprint (we only need where the shape sat, not exact geometry).
   * @param {string} d
   * @returns {{ minX:number, minY:number, maxX:number, maxY:number } | null}
   */
  _pathBBox(d) {
    const commands = parsePath(d);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let seen = false;
    commands.forEach(
      /** @param {any[]} c */
      (c) => {
        const cmd = c[0];
        if (cmd === "Z") return;
        let pairs = [];
        if (cmd === "H") pairs = [[c[1], (minY + maxY) / 2 || c[1]]];
        else if (cmd === "V") pairs = [[(minX + maxX) / 2 || c[1], c[1]]];
        else if (cmd === "A") pairs = [[c[6], c[7]]];
        else {
          for (let k = 1; k + 1 < c.length; k += 2) pairs.push([c[k], c[k + 1]]);
        }
        pairs.forEach(([x, y]) => {
          if (!isFinite(x) || !isFinite(y)) return;
          seen = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });
      }
    );
    if (!seen) return null;
    return { minX, minY, maxX, maxY };
  }
  /**
   * @param {number} realIndex
   * @param {number} j
   * @returns {string | null}
   */
  getInitialFillFor(realIndex, j) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`);
    return entry ? entry.fill : null;
  }
  /** @returns {number} */
  getSpeed() {
    const animCfg = this.w.config.chart.animations;
    return animCfg.chartTypeMorph && animCfg.chartTypeMorph.speed || animCfg.speed || 600;
  }
  /**
   * Fade newly-mounted axes / grid / legend / titles from opacity 0 → 1 in
   * parallel with the morph. Without this the chart's chrome would pop in
   * abruptly while the series elements are still mid-tween, which reads as a
   * jarring layout shift.
   */
  applyChromeFade() {
    var _a;
    if (!this._snapshot || !Environment.isBrowser()) return;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl) return;
    if (this._snapshot.pieceOut) this._separatePieces();
    else if (this._snapshot.pieceIn) this._combinePieces();
    else this._mountGhost();
    const speed = this.getSpeed();
    const chromeSelectors = [
      ".apexcharts-xaxis",
      ".apexcharts-yaxis",
      ".apexcharts-grid",
      ".apexcharts-gridlines-horizontal",
      ".apexcharts-gridlines-vertical",
      ".apexcharts-legend",
      ".apexcharts-title-text",
      ".apexcharts-subtitle-text"
    ];
    chromeSelectors.forEach((sel) => {
      baseEl.querySelectorAll(sel).forEach((el) => {
        if (!el.style) return;
        el.style.opacity = "0";
        el.style.transition = `opacity ${speed}ms ease-out`;
        BrowserAPIs.requestAnimationFrame(() => {
          el.style.opacity = "1";
        });
        setTimeout(() => {
          el.style.transition = "";
          el.style.opacity = "";
        }, speed + 80);
      });
    });
    setTimeout(() => this.cleanup(), speed + 100);
  }
  cleanup() {
    this._snapshot = null;
    this._removeGhost();
    this._cancelPieces();
  }
}
_core__default.registerFeatures({ morphTypeChange: MorphTypeChange });
const XHTML$3 = "http://www.w3.org/1999/xhtml";
const BREADCRUMB_HEIGHT = 18;
function breadcrumbConfig(w2, localCfg) {
  const shared = w2.config.drilldown && w2.config.drilldown.breadcrumb || {};
  return __spreadValues(__spreadValues({
    show: true,
    position: "top-left",
    separator: " / ",
    rootLabel: "All",
    offsetX: 0,
    offsetY: 0,
    formatter: void 0
  }, shared), localCfg || {});
}
function avoidChromeOverlap(w2, nav) {
  const chrome = (
    /** @type {Element[]} */
    [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s) => w2.dom.baseEl.querySelector(s)).filter((el) => el !== null)
  );
  if (!chrome.length) return;
  const wrapTop = w2.dom.elWrap.getBoundingClientRect().top;
  for (let pass = 0; pass < chrome.length + 1; pass++) {
    const nr = nav.getBoundingClientRect();
    const hit = chrome.find((el) => {
      const r = el.getBoundingClientRect();
      return nr.left < r.right && nr.right > r.left && nr.top < r.bottom && nr.bottom > r.top;
    });
    if (!hit) break;
    nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`;
  }
}
function breadcrumbCeiling(w2, nav) {
  const gridTop = w2.layout.translateY || 0;
  const elWrap = w2.dom.elWrap;
  if (!elWrap) return gridTop;
  const labels = w2.dom.baseEl.querySelectorAll(".apexcharts-yaxis-label");
  if (!labels.length) return gridTop;
  const wrapTop = elWrap.getBoundingClientRect().top;
  const navRect = nav.getBoundingClientRect();
  let ceiling = gridTop;
  for (let i = 0; i < labels.length; i++) {
    const r = labels[i].getBoundingClientRect();
    if (!r.height) continue;
    if (r.left >= navRect.right || r.right <= navRect.left) continue;
    ceiling = Math.min(ceiling, r.top - wrapTop);
  }
  return ceiling;
}
function placeInReservedBand(w2, ctx, nav, cfg) {
  var _a;
  const dimHelpers = (_a = ctx == null ? void 0 : ctx.dimensions) == null ? void 0 : _a.dimHelpers;
  const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
  const navH = nav.getBoundingClientRect().height || BREADCRUMB_HEIGHT;
  const offsetY = cfg && cfg.offsetY || 0;
  const ceiling = breadcrumbCeiling(w2, nav);
  if (ceiling - titleArea >= navH + 1) {
    nav.style.top = `${ceiling - navH - 1 + offsetY}px`;
    return true;
  }
  nav.style.top = `${titleArea + offsetY}px`;
  const dark = w2.config.theme.mode === "dark";
  nav.style.background = dark ? "rgba(20,24,30,0.82)" : "rgba(255,255,255,0.86)";
  nav.style.borderRadius = "4px";
  return false;
}
function clearBreadcrumb(w2) {
  const elWrap = w2.dom.elWrap;
  if (!elWrap) return;
  const existing = elWrap.querySelector(".apexcharts-breadcrumb");
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
}
function renderBreadcrumb(w2, opts) {
  if (!Environment.isBrowser()) return null;
  const elWrap = w2.dom.elWrap;
  if (!elWrap) return null;
  clearBreadcrumb(w2);
  const cfg = opts.config || breadcrumbConfig(w2);
  if (cfg.show === false) return null;
  const crumbs = opts.crumbs || [];
  if (crumbs.length < 2) return null;
  const nav = BrowserAPIs.createElementNS(XHTML$3, "nav");
  nav.setAttribute("class", "apexcharts-breadcrumb");
  nav.setAttribute("aria-label", opts.ariaLabel || "Breadcrumb");
  positionBreadcrumb(nav, cfg);
  if (opts.compact) {
    nav.style.fontSize = "11px";
    nav.style.padding = "0 2px";
  }
  const separator = cfg.separator != null ? cfg.separator : " / ";
  crumbs.forEach((crumb, i) => {
    var _a;
    if (i > 0) {
      const sep = BrowserAPIs.createElementNS(XHTML$3, "span");
      sep.setAttribute("class", "apexcharts-breadcrumb-separator");
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = separator;
      nav.appendChild(sep);
    }
    let label = i === 0 ? (_a = cfg.rootLabel) != null ? _a : "All" : crumb.label;
    if (typeof cfg.formatter === "function") {
      label = cfg.formatter(label, {
        index: i,
        depth: crumbs.length - 1,
        data: crumb.data
      });
    }
    if (i === crumbs.length - 1) {
      const cur = BrowserAPIs.createElementNS(XHTML$3, "span");
      cur.setAttribute(
        "class",
        "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
      );
      cur.setAttribute("aria-current", "page");
      cur.textContent = String(label);
      nav.appendChild(cur);
      return;
    }
    const btn = (
      /** @type {HTMLButtonElement} */
      BrowserAPIs.createElementNS(XHTML$3, "button")
    );
    btn.setAttribute("type", "button");
    btn.setAttribute("class", "apexcharts-breadcrumb-item");
    if (i === 0) {
      const arrow = BrowserAPIs.createElementNS(XHTML$3, "span");
      arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "←";
      btn.appendChild(arrow);
    }
    const text = BrowserAPIs.createElementNS(XHTML$3, "span");
    text.setAttribute("class", "apexcharts-breadcrumb-label");
    text.textContent = String(label);
    btn.appendChild(text);
    btn.addEventListener("click", () => opts.onNavigate(i, crumb));
    nav.appendChild(btn);
  });
  elWrap.appendChild(nav);
  return nav;
}
function positionBreadcrumb(nav, cfg) {
  const ox = cfg.offsetX || 0;
  const oy = cfg.offsetY || 0;
  nav.style.position = "absolute";
  nav.style.top = oy + "px";
  if (cfg.position === "top-right") {
    nav.style.right = -ox + 3 + "px";
  } else {
    nav.style.left = ox + "px";
  }
}
const XHTML$2 = "http://www.w3.org/1999/xhtml";
class Breadcrumb {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {import('./Drilldown').default} drilldown
   */
  constructor(w2, ctx, drilldown) {
    this.w = w2;
    this.ctx = ctx;
    this.drilldown = drilldown;
  }
  /**
   * @param {Array<string|number>} path - ['root', id, id, ...]
   */
  render(path) {
    if (!Environment.isBrowser()) return;
    const w2 = this.w;
    const elWrap = w2.dom.elWrap;
    if (!elWrap) return;
    const existing = elWrap.querySelector(".apexcharts-breadcrumb");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const cfg = w2.config.drilldown && w2.config.drilldown.breadcrumb;
    if (!cfg || cfg.show === false) return;
    if (this.drilldown.depth === 0) return;
    const nav = BrowserAPIs.createElementNS(XHTML$2, "nav");
    nav.setAttribute("class", "apexcharts-breadcrumb");
    nav.setAttribute("aria-label", "Drilldown breadcrumb");
    this._position(nav, cfg);
    const separator = cfg.separator != null ? cfg.separator : " / ";
    path.forEach((id, i) => {
      if (i > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML$2, "span");
        sep.setAttribute("class", "apexcharts-breadcrumb-separator");
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        nav.appendChild(sep);
      }
      const label = this._label(id, i);
      const isCurrent = i === path.length - 1;
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML$2, "span");
        cur.setAttribute(
          "class",
          "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
        );
        cur.setAttribute("aria-current", "page");
        cur.textContent = label;
        nav.appendChild(cur);
      } else {
        const btn = (
          /** @type {HTMLButtonElement} */
          BrowserAPIs.createElementNS(XHTML$2, "button")
        );
        btn.setAttribute("type", "button");
        btn.setAttribute("class", "apexcharts-breadcrumb-item");
        if (i === 0) {
          const arrow = BrowserAPIs.createElementNS(XHTML$2, "span");
          arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "←";
          btn.appendChild(arrow);
        }
        const text = BrowserAPIs.createElementNS(XHTML$2, "span");
        text.setAttribute("class", "apexcharts-breadcrumb-label");
        text.textContent = label;
        btn.appendChild(text);
        btn.addEventListener("click", () => this.drilldown.drillToLevel(i));
        nav.appendChild(btn);
      }
    });
    elWrap.appendChild(nav);
    if (this.w.globals.axisCharts) {
      placeInReservedBand(this.w, this.ctx, nav, cfg);
    }
    this._avoidChromeOverlap(nav);
  }
  /**
   * The breadcrumb is an absolute overlay, so at its default top-left it can
   * sit on top of a left-aligned title (or subtitle). After mounting, push it
   * below any chart chrome it intersects. (Sunburst's self-contained
   * breadcrumb applies the same rule.)
   * @param {HTMLElement} nav
   */
  _avoidChromeOverlap(nav) {
    const w2 = this.w;
    const chrome = (
      /** @type {Element[]} */
      [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s) => w2.dom.baseEl.querySelector(s)).filter((el) => el !== null)
    );
    if (!chrome.length) return;
    const wrapTop = w2.dom.elWrap.getBoundingClientRect().top;
    for (let pass = 0; pass < chrome.length + 1; pass++) {
      const nr = nav.getBoundingClientRect();
      const hit = chrome.find((el) => {
        const r = el.getBoundingClientRect();
        return nr.left < r.right && nr.right > r.left && nr.top < r.bottom && nr.bottom > r.top;
      });
      if (!hit) break;
      nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`;
    }
  }
  /**
   * @param {string|number} id
   * @param {number} index
   * @returns {string}
   */
  _label(id, index) {
    const cfg = this.w.config.drilldown.breadcrumb;
    let label;
    if (index === 0) {
      label = cfg.rootLabel != null ? cfg.rootLabel : "All";
    } else {
      const list = (this.w.config.drilldown.series || []).find(
        (s) => s && s.id === id
      );
      label = list && list.name || String(id);
    }
    if (typeof cfg.formatter === "function") {
      return cfg.formatter(label, { index, depth: this.drilldown.depth });
    }
    return label;
  }
  /**
   * @param {HTMLElement} nav
   * @param {Record<string, any>} cfg
   */
  _position(nav, cfg) {
    const ox = cfg.offsetX || 0;
    const oy = cfg.offsetY || 0;
    nav.style.position = "absolute";
    nav.style.top = oy + "px";
    if (cfg.position === "top-right") {
      nav.style.right = -ox + 3 + "px";
    } else {
      nav.style.left = ox + "px";
    }
  }
}
const XHTML$1 = "http://www.w3.org/1999/xhtml";
const CLASS = "apexcharts-drilldown-loading";
class DrilldownLoading {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w2) {
    this.w = w2;
    this.el = null;
  }
  /** @returns {any} the drilldown.loading config, normalised. */
  _cfg() {
    const d = this.w.config.drilldown;
    const l = d && d.loading;
    if (l === false) return { show: false };
    return l || {};
  }
  /**
   * Mount the overlay. No-op when disabled, outside a browser, or already up.
   */
  show() {
    if (!Environment.isBrowser()) return;
    const cfg = this._cfg();
    if (cfg.show === false) return;
    const elWrap = this.w.dom.elWrap;
    if (!elWrap) return;
    this.hide();
    const box = BrowserAPIs.createElementNS(XHTML$1, "div");
    box.setAttribute("class", CLASS);
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-label", cfg.text || "Loading");
    const spinner = BrowserAPIs.createElementNS(XHTML$1, "div");
    spinner.setAttribute("class", `${CLASS}-spinner`);
    spinner.setAttribute("aria-hidden", "true");
    box.appendChild(spinner);
    if (cfg.text) {
      const label = BrowserAPIs.createElementNS(XHTML$1, "span");
      label.setAttribute("class", `${CLASS}-text`);
      label.textContent = cfg.text;
      box.appendChild(label);
    }
    elWrap.appendChild(box);
    this.el = box;
  }
  /** Remove the overlay. Safe to call when it is not mounted. */
  hide() {
    const elWrap = this.w.dom.elWrap;
    if (elWrap) {
      const nodes = elWrap.querySelectorAll(`.${CLASS}`);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.parentNode) n.parentNode.removeChild(n);
      }
    } else if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
const MAX_DEPTH = 32;
const DRILL_MARKER = "__apexDrilldownMarker";
class Drilldown {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    this.stack = [];
    this.rootSnapshot = null;
    this._wired = false;
    this._asyncCache = /* @__PURE__ */ new Map();
    this._pending = null;
    this._warnedUnreachable = false;
    this._warnedNoSliceOffset = false;
    this.breadcrumb = new Breadcrumb(w2, ctx, this);
    this.loading = new DrilldownLoading(w2);
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
    this._onPlotDown = this._onPlotDown.bind(this);
    this._onPlotClick = this._onPlotClick.bind(this);
    this._downAt = null;
    this._plotClickWired = null;
    this.init();
  }
  init() {
    const w2 = this.w;
    if (!w2.config.drilldown || !w2.config.drilldown.enabled) return;
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("dataPointSelection", this._onPointSelect);
    this.ctx.addEventListener("mounted", this._afterRender);
    this.ctx.addEventListener("updated", this._afterRender);
    if (w2.config.markers) {
      w2.config.markers.discrete = this._drillMarkers(w2.config.series);
    }
  }
  // ─── Observable state ──────────────────────────────────────────────────────
  /** @returns {Array<string|number>} e.g. ['root', '2024-quarters'] */
  get path() {
    return ["root", ...this.stack.map((f) => f.id)];
  }
  /** @returns {number} 0 at root */
  get depth() {
    return this.stack.length;
  }
  // ─── Navigation API ────────────────────────────────────────────────────────
  /**
   * Drill into the child level with the given id.
   * @param {string|number} id
   * @param {any} [triggerPoint] - the clicked data point (for events / async ctx)
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  drillDown(id, triggerPoint, meta) {
    const child = this._resolveChild(id);
    if (child) return this._drillInto(child, triggerPoint, meta);
    if (typeof this.w.config.drilldown.onDrillDown === "function") {
      return this._drillDownAsync(id, triggerPoint, meta);
    }
    console.warn(
      `ApexCharts: drilldown id "${id}" not found in chart.drilldown.series, and no onDrillDown resolver is set.`
    );
    return Promise.resolve(this.ctx);
  }
  /**
   * Navigate back one level.
   * @returns {Promise<any>}
   */
  drillUp() {
    return this.drillToLevel(this.stack.length - 1);
  }
  /**
   * Navigate back to the root view.
   * @returns {Promise<any>}
   */
  drillToRoot() {
    return this.drillToLevel(0);
  }
  /**
   * Navigate to an arbitrary depth (0 = root). Used by breadcrumb clicks.
   * @param {number} targetDepth
   * @returns {Promise<any>}
   */
  drillToLevel(targetDepth) {
    const cur = this.stack.length;
    if (targetDepth < 0 || targetDepth >= cur) return Promise.resolve(this.ctx);
    const from = this.path[this.path.length - 1];
    const restore = targetDepth === 0 ? this.rootSnapshot : this.stack[targetDepth].restore;
    this.stack = this.stack.slice(0, targetDepth);
    const to = this.path[this.path.length - 1];
    return this._apply(this._viewFromSnapshot(restore), "up", { from, to });
  }
  // ─── Internals ─────────────────────────────────────────────────────────────
  /**
   * @param {string|number} id
   * @returns {any|null}
   */
  _resolveChild(id) {
    const list = this.w.config.drilldown && this.w.config.drilldown.series;
    if (!Array.isArray(list)) return null;
    return list.find((s) => s && s.id === id) || null;
  }
  /**
   * @param {any} child
   * @param {any} [triggerPoint]
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillInto(child, triggerPoint, meta) {
    if (this.stack.length >= MAX_DEPTH) {
      console.warn(`ApexCharts: drilldown max depth (${MAX_DEPTH}) reached.`);
      return Promise.resolve(this.ctx);
    }
    if (!this.rootSnapshot) this.rootSnapshot = this._snapshot();
    const from = this.path[this.path.length - 1];
    this.stack.push({ id: child.id, name: child.name, restore: this._snapshot() });
    return this._apply(this._viewFromChild(child), "down", {
      from,
      to: child.id,
      point: triggerPoint,
      seriesIndex: meta && meta.seriesIndex,
      dataPointIndex: meta && meta.dataPointIndex
    });
  }
  /**
   * Resolve a level through `onDrillDown` and drill into it.
   *
   * Failure never changes state: on a throw, a rejection, or a resolver that
   * hands back something undrillable, the chart stays exactly where it was and
   * `drillDownError` fires. That is what makes this usable against a real
   * backend, where a fetch failing is ordinary rather than exceptional.
   *
   * @param {string|number|null} id
   * @param {any} point
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillDownAsync(id, point, meta) {
    const cfg = this.w.config.drilldown;
    const fn = cfg.onDrillDown;
    const cached = this._cacheGet(id);
    if (cached) return this._drillInto(cached, point, meta);
    if (this._pending) return this._pending;
    let result;
    this.loading.show();
    try {
      result = fn({
        // `id` was missing here, so a resolver could not tell WHICH level was
        // asked for without re-deriving it from the point. It is the first
        // thing a real implementation needs (`fetch('/levels/' + id)`).
        id,
        point,
        seriesIndex: meta && meta.seriesIndex,
        dataPointIndex: meta && meta.dataPointIndex
      });
    } catch (error) {
      this.loading.hide();
      this._fire("drillDownError", { id, error });
      return Promise.resolve(this.ctx);
    }
    const settle = () => {
      this._pending = null;
      this.loading.hide();
    };
    const p2 = Promise.resolve(result).then(
      (child) => {
        settle();
        if (this._isDead()) return this.ctx;
        if (!child || !child.data) {
          this._fire("drillDownError", {
            id,
            error: new Error(
              `drilldown: onDrillDown resolved without a drillable level for id "${id}" (expected an object with a \`data\` array).`
            )
          });
          return this.ctx;
        }
        const level = child.id != null ? child : __spreadProps(__spreadValues({}, child), { id });
        this._cacheSet(id, level);
        return this._drillInto(level, point, meta);
      },
      (error) => {
        settle();
        if (this._isDead()) return this.ctx;
        this._fire("drillDownError", { id, error });
        return this.ctx;
      }
    );
    this._pending = p2;
    return p2;
  }
  /**
   * Whether the chart was torn down while a resolver was in flight.
   *
   * Clicking to drill and then navigating away is ordinary, not exceptional: a
   * component unmounts, `destroy()` runs, and the fetch settles afterwards.
   * Without this the resolved level would be applied to a destroyed chart,
   * which throws out of `updateOptions` and surfaces in the host app as an
   * unhandled rejection from a click the user has already forgotten about.
   *
   * @returns {boolean}
   */
  _isDead() {
    const w2 = this.w;
    return !w2 || !w2.globals || w2.globals.isDestroyed === true;
  }
  /** @returns {boolean} whether resolved async levels are cached. */
  _cacheEnabled() {
    const cfg = this.w.config.drilldown;
    return !!(cfg && cfg.cache !== false);
  }
  /**
   * @param {string|number|null} id
   * @returns {any|null}
   */
  _cacheGet(id) {
    if (!this._cacheEnabled() || id == null) return null;
    return this._asyncCache.get(id) || null;
  }
  /**
   * @param {string|number|null} id
   * @param {any} level
   */
  _cacheSet(id, level) {
    if (!this._cacheEnabled() || id == null) return;
    this._asyncCache.set(id, level);
  }
  /**
   * Drop cached async levels, so the next drill re-runs `onDrillDown`. Call it
   * when the underlying data changes behind a chart that has already drilled.
   * @param {string|number} [id] a single level, or every level when omitted
   * @returns {any} the chart, for chaining
   */
  clearCache(id) {
    if (id == null) this._asyncCache.clear();
    else this._asyncCache.delete(id);
    return this.ctx;
  }
  /**
   * Capture the overridable surface of the current view so it can be restored.
   * Only fields that some drilldown.series entry can change are cloned; series
   * and chart.type/stacked are always captured.
   * @returns {object}
   */
  _snapshot() {
    const c = this.w.config;
    const fields = this._overrideFields();
    const snap = { series: this._uncollapseSeries(Utils.clone(c.series)) };
    if (Array.isArray(c.labels) && c.labels.length) {
      snap.labels = Utils.clone(c.labels);
    }
    snap.chart = { type: c.chart.type, stacked: c.chart.stacked };
    if (fields.has("xaxis")) snap.xaxis = Utils.clone(c.xaxis);
    if (fields.has("yaxis")) snap.yaxis = Utils.clone(c.yaxis);
    if (fields.has("colors")) snap.colors = c.colors ? Utils.clone(c.colors) : void 0;
    if (fields.has("plotOptions")) snap.plotOptions = Utils.clone(c.plotOptions);
    if (fields.has("fill")) snap.fill = Utils.clone(c.fill);
    if (fields.has("legend")) snap.legend = Utils.clone(c.legend);
    return snap;
  }
  /**
   * Restore any legend-collapsed slices/series to their original values in a
   * cloned series array, so a drill snapshot captures the pre-collapse data.
   * Mirrors legend Helpers' collapse addressing: object-form pie/donut packs
   * every slice as a data point inside `series[0].data`; numeric pie stores a
   * slice per top-level element; axis series carry a `data` array. No-op when
   * nothing is collapsed.
   * @param {any[]} series
   * @returns {any[]}
   */
  _uncollapseSeries(series) {
    const w2 = this.w;
    const gl = w2.globals;
    const entries = [
      ...gl.collapsedSeries || [],
      ...gl.ancillaryCollapsedSeries || []
    ];
    if (!entries.length) return series;
    const type = w2.config.chart.type;
    const objectFormPie = (type === "pie" || type === "donut" || type === "polarArea") && series.length === 1 && series[0] && typeof series[0] === "object" && Array.isArray(series[0].data);
    const container = objectFormPie ? series[0].data : series;
    for (const entry of entries) {
      const i = entry.index;
      if (gl.axisCharts) {
        if (series[i]) {
          series[i].data = Array.isArray(entry.data) ? entry.data.slice() : entry.data;
        }
      } else if (container[i] && typeof container[i] === "object") {
        container[i].y = entry.data;
      } else if (container[i] !== void 0) {
        container[i] = entry.data;
      }
    }
    return series;
  }
  /**
   * Union of overridable fields across all declared drilldown levels. Ensures a
   * deep drillToRoot restores everything any intermediate level may have changed.
   * @returns {Set<string>}
   */
  _overrideFields() {
    const fields = /* @__PURE__ */ new Set();
    const list = this.w.config.drilldown && this.w.config.drilldown.series || [];
    for (const s of list) {
      if (!s) continue;
      if (s.xaxis) fields.add("xaxis");
      if (s.yaxis) fields.add("yaxis");
      if (s.colors) fields.add("colors");
      if (s.plotOptions) fields.add("plotOptions");
      if (s.fill) fields.add("fill");
      if (s.legend) fields.add("legend");
    }
    return fields;
  }
  /**
   * Copy the optional view fields shared by a drilldown child level and a
   * restore snapshot (`xaxis`, `yaxis`, `colors`, `plotOptions`, `fill`,
   * `legend`) from `src` onto `view`, only when present.
   * @param {Record<string, any>} view @param {Record<string, any>} src
   */
  _copyOptionalViewFields(view, src) {
    if (src.xaxis) view.xaxis = src.xaxis;
    if (src.yaxis) view.yaxis = src.yaxis;
    if (src.colors) view.colors = src.colors;
    if (src.plotOptions) view.plotOptions = src.plotOptions;
    if (src.fill) view.fill = src.fill;
    if (src.legend) view.legend = src.legend;
  }
  /**
   * Build an updateOptions/updateSeries payload for drilling INTO a child level.
   * Works for axis charts and pie/donut alike: both accept series objects with a
   * `data` array of `{ x, y }` points (pie derives slice labels from `x`).
   * @param {any} child
   * @returns {Record<string, any>}
   */
  _viewFromChild(child) {
    const view = {};
    if (Array.isArray(child.series)) {
      view.series = child.series;
    } else {
      view.series = [{ name: child.name || "", data: child.data }];
    }
    const chart = {};
    if (child.chart && child.chart.type) chart.type = child.chart.type;
    if (child.chart && child.chart.stacked != null) chart.stacked = child.chart.stacked;
    if (Object.keys(chart).length) view.chart = chart;
    this._copyOptionalViewFields(view, child);
    return view;
  }
  /**
   * Build an updateOptions payload from a restore-snapshot.
   * @param {Record<string, any>} snap
   * @returns {Record<string, any>}
   */
  _viewFromSnapshot(snap) {
    const view = { series: snap.series, chart: snap.chart };
    if (snap.labels && snap.labels.length) view.labels = snap.labels;
    this._copyOptionalViewFields(view, snap);
    return view;
  }
  /**
   * Apply a view by delegating to the right update path, firing drill events
   * around it.
   * @param {Record<string, any>} view
   * @param {'down'|'up'} direction
   * @param {object} meta
   * @returns {Promise<any>}
   */
  _apply(view, direction, meta) {
    const w2 = this.w;
    w2.interact.selectedDataPoints = [];
    w2.globals.collapsedSeries = [];
    w2.globals.collapsedSeriesIndices = [];
    w2.globals.ancillaryCollapsedSeries = [];
    w2.globals.ancillaryCollapsedSeriesIndices = [];
    w2.globals.allSeriesCollapsed = false;
    w2.globals.risingSeries = [];
    view.markers = __spreadProps(__spreadValues({}, view.markers || {}), {
      discrete: this._drillMarkers(view.series)
    });
    const animate = (!w2.config.drilldown.animation || w2.config.drilldown.animation.enabled !== false) && w2.config.chart.animations.enabled !== false;
    if (direction === "down") this._fire("drillDownStart", meta);
    const runUpdate = (anim) => this.ctx.updateOptions(view, false, anim, false, false);
    const done = () => {
      this._fire(direction === "down" ? "drillDownEnd" : "drillUp", meta);
      return this.ctx;
    };
    if (animate && this._zoomEnabled()) {
      const origin = this._triggerOrigin(meta);
      if (origin) {
        return this._zoomDrill(origin, direction, () => runUpdate(false)).then(done);
      }
    }
    return runUpdate(animate).then(done);
  }
  /** @returns {boolean} whether trigger-point zoom is configured on. */
  _zoomEnabled() {
    const a = this.w.config.drilldown && this.w.config.drilldown.animation;
    return !!(a && a.zoomFromPoint);
  }
  /** @returns {SVGSVGElement|null} the chart's root <svg> node, if present. */
  _svgNode() {
    const paper = this.w.dom && this.w.dom.Paper;
    return paper && paper.node ? paper.node : null;
  }
  /**
   * The group wrapping ONLY the data marks (bars/cells/tiles) — not the axes,
   * grid, or titles. Animating this keeps the chart frame still while the marks
   * move. Covers bar/line/area (`.apexcharts-plot-series`), heatmap, and treemap.
   * @returns {SVGElement|null}
   */
  _markGroup() {
    const svg = this._svgNode();
    if (!svg || typeof svg.querySelector !== "function") return null;
    return svg.querySelector(
      ".apexcharts-plot-series, .apexcharts-heatmap, .apexcharts-treemap"
    );
  }
  /**
   * Centre of the clicked point in the SVG's view-box pixel space, used as the
   * transform-origin for the mark-group scale (which uses `transform-box:
   * view-box`, so the origin is resolved in SVG coordinates and stays stable
   * across the parent and child renders). Falls back to the mark group's centre
   * when there is no trigger point (e.g. drillUp / imperative drill). Returns
   * null when the marks / SVG / WAAPI are unavailable (SSR / old browsers).
   * @param {object} meta
   * @returns {{ x: number, y: number }|null}
   */
  _triggerOrigin(meta) {
    if (!Environment.isBrowser()) return null;
    const svg = this._svgNode();
    const group = this._markGroup();
    if (!svg || !group || typeof group.animate !== "function" || typeof svg.getBoundingClientRect !== "function") {
      return null;
    }
    const svgRect = svg.getBoundingClientRect();
    let el = null;
    if (meta && meta.seriesIndex != null && meta.dataPointIndex != null && this.w.dom.baseEl) {
      el = this.w.dom.baseEl.querySelector(
        `[index="${meta.seriesIndex}"][j="${meta.dataPointIndex}"]`
      );
    }
    if (el && typeof el.getBoundingClientRect === "function") {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - svgRect.left,
        y: r.top + r.height / 2 - svgRect.top
      };
    }
    const gRect = group.getBoundingClientRect();
    return {
      x: gRect.left + gRect.width / 2 - svgRect.left,
      y: gRect.top + gRect.height / 2 - svgRect.top
    };
  }
  /**
   * Run the "expand from the clicked point" choreography around an instant
   * (un-animated) update. Only the data-mark group is animated — the axes, grid,
   * and titles stay fixed, so the effect doesn't drag the whole chart frame. The
   * current marks fade out near-in-place (a quick fade, not a balloon), the child
   * renders invisibly underneath, then the child marks unfold outward from the
   * clicked point: a horizontal-biased scale anchored there, so the bars read as
   * emerging from the column you clicked. Drilling up has no trigger column, so
   * it settles gently from the marks' centre.
   *
   * `transform-box: view-box` resolves the origin in SVG coordinates, so the same
   * origin applies cleanly to the parent and the freshly-rendered child group.
   * @param {{ x: number, y: number }} origin
   * @param {'down'|'up'} direction
   * @param {() => Promise<any>} runUpdate
   * @returns {Promise<void>}
   */
  _zoomDrill(origin, direction, runUpdate) {
    return __async(this, null, function* () {
      const dur = this._zoomDuration();
      const down = direction === "down";
      const outDur = Math.round(dur * 0.55);
      const outTo = down ? "scale(1.03)" : "scale(0.97)";
      const inFrom = down ? "scaleX(0.55) scaleY(0.85)" : "scale(1.04)";
      const anchor = (el) => {
        el.style.transformBox = "view-box";
        el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      };
      const clear = (el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.transformOrigin = "";
        el.style.transformBox = "";
      };
      const outGroup = this._markGroup();
      let outAnim = null;
      if (outGroup) {
        anchor(outGroup);
        outAnim = outGroup.animate(
          [
            { transform: "scale(1)", opacity: 1 },
            { transform: outTo, opacity: 0 }
          ],
          { duration: outDur, easing: "ease-in", fill: "forwards" }
        );
        try {
          yield outAnim.finished;
        } catch (e) {
        }
      }
      yield runUpdate();
      const inGroup = this._markGroup();
      if (inGroup) {
        anchor(inGroup);
        inGroup.style.opacity = "0";
        inGroup.style.transform = inFrom;
        if (outAnim && outGroup === inGroup) outAnim.cancel();
        const inAnim = inGroup.animate(
          [
            { transform: inFrom, opacity: 0 },
            { transform: "scale(1)", opacity: 1 }
          ],
          // Decelerating ease so the unfold settles softly into place.
          { duration: dur, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
        );
        try {
          yield inAnim.finished;
        } catch (e) {
        }
        clear(inGroup);
        inAnim.cancel();
      }
    });
  }
  /** @returns {number} per-phase zoom duration in ms. */
  _zoomDuration() {
    const a = this.w.config.drilldown && this.w.config.drilldown.animation;
    const speed = a && typeof a.speed === "number" ? a.speed : 260;
    return Math.max(80, speed);
  }
  /**
   * Fire a drill event through both the config callback and the listener registry.
   * @param {string} name
   * @param {object} payload
   */
  _fire(name, payload) {
    const cb = this.w.config.chart.events && this.w.config.chart.events[name];
    if (typeof cb === "function") cb(payload, this.ctx, this.w);
    this.ctx.events.fireEvent(name, [payload, this.ctx, this.w]);
  }
  // ─── Click + post-render hooks ───────────────────────────────────────────────
  /**
   * @param {Event} _event
   * @param {any} _ctx
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} opts
   */
  _onPointSelect(_event, _ctx, opts) {
    if (!opts) return void 0;
    const point = this._pointAt(opts.seriesIndex, opts.dataPointIndex);
    if (point && typeof point === "object" && point.drilldown != null) {
      return this.drillDown(point.drilldown, point, opts);
    }
    if (typeof this.w.config.drilldown.onDrillDown === "function") {
      return this._drillDownAsync(null, point, opts);
    }
    return void 0;
  }
  /**
   * @param {number|undefined} seriesIndex
   * @param {number|undefined} dataPointIndex
   * @returns {any|null}
   */
  _pointAt(seriesIndex, dataPointIndex) {
    const series = this.w.config.series;
    if (!Array.isArray(series) || seriesIndex == null || dataPointIndex == null) {
      return null;
    }
    const s = series[seriesIndex];
    if (!s || !Array.isArray(s.data)) return null;
    return s.data[dataPointIndex] != null ? s.data[dataPointIndex] : null;
  }
  _afterRender() {
    const w2 = this.w;
    if (!w2.config.drilldown || !w2.config.drilldown.enabled) return;
    this._markDrillableTargets();
    this._wirePlotClick();
    this.breadcrumb.render(this.path);
    if (w2.config.markers) {
      w2.config.markers.discrete = this._drillMarkers(w2.config.series);
    }
  }
  /**
   * Mark every point that carries a `drilldown` field as an openable target.
   *
   * Two things have to be true for a point to be drillable, and on line/area
   * neither holds by default. It needs a mark to click (with `markers.size: 0`
   * there is no element at all), and that mark has to accept the click: core
   * gives line/area markers `no-pointer-events` so the shared tooltip can track
   * the whole plot, which silently swallows it. `_drillMarkers()` supplies the
   * missing dots; this re-enables pointer events on them.
   *
   * The cursor class only goes on marks that can actually take the click, so we
   * never promise an interaction that cannot happen.
   */
  _markDrillableTargets() {
    if (!Environment.isBrowser()) return;
    const w2 = this.w;
    const baseEl = w2.dom.baseEl;
    const series = w2.config.series;
    if (!baseEl || !Array.isArray(series)) return;
    let unreachable = 0;
    series.forEach((s, i) => {
      const data = s && Array.isArray(s.data) ? s.data : null;
      if (!data) return;
      data.forEach((point, j) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const nodes = baseEl.querySelectorAll(`[index="${i}"][j="${j}"]`);
        if (!nodes.length) unreachable++;
        nodes.forEach((node) => {
          if (this._isClickThroughMark(node)) {
            node.classList.remove("no-pointer-events");
          }
          node.classList.add("apexcharts-drilldown-target");
        });
      });
    });
    if (unreachable && !this._warnedUnreachable) {
      this._warnedUnreachable = true;
      console.warn(
        `ApexCharts: ${unreachable} drillable point(s) have no clickable mark, so clicking them cannot do anything. Leave \`drilldown.marker\` on, or give the series markers of its own (\`markers.size > 0\`).`
      );
    }
  }
  /**
   * Called by Pie when it declines to wire the slice pull-out because this
   * chart drills. Warned once per chart (a drill re-renders, and the same
   * notice on every navigation is just noise), and from here rather than from
   * Pie because this module is the reason it is unavailable.
   */
  warnSliceOffsetDisabled() {
    if (this._warnedNoSliceOffset) return;
    this._warnedNoSliceOffset = true;
    console.warn(
      "ApexCharts: `plotOptions.pie.expandOnClick` is not available in a drilldown pie/donut, so it was ignored. A slice click navigates, and a slice that slid out would be discarded by the drill it just triggered."
    );
  }
  /**
   * Make the whole band a drillable point owns clickable, not just its dot.
   *
   * A dot is ~6px across, so hitting it takes pixel-precise aim, it is far under
   * the ~44px a finger needs, and the tooltip's arrow points AT the point by
   * design, which puts a triangle over the very thing you are aiming at. Rather
   * than move the tooltip, widen the target: a click anywhere in the plot drills
   * whichever point the tooltip is currently reading. The hit area then matches
   * the feedback already on screen, so "the tooltip says 2024, I click, I get
   * 2024" holds, and the dot goes back to being an affordance rather than a
   * target you have to chase.
   *
   * Only for the point-based types, since a bar, slice or tile is already a
   * comfortably large mark and drilling one by clicking the background near it
   * would be surprising.
   */
  _wirePlotClick() {
    if (!Environment.isBrowser()) return;
    const baseEl = this.w.dom.baseEl;
    if (!baseEl || this._plotClickWired === baseEl) return;
    if (this._plotClickWired) {
      this._plotClickWired.removeEventListener("mousedown", this._onPlotDown);
      this._plotClickWired.removeEventListener("click", this._onPlotClick);
    }
    baseEl.addEventListener("mousedown", this._onPlotDown);
    baseEl.addEventListener("click", this._onPlotClick);
    this._plotClickWired = baseEl;
  }
  /** @param {any} e */
  _onPlotDown(e) {
    this._downAt = { x: e.clientX, y: e.clientY };
  }
  /**
   * @param {any} e
   * @returns {any}
   */
  _onPlotClick(e) {
    const w2 = this.w;
    if (!w2.config.drilldown || !w2.config.drilldown.enabled) return void 0;
    const down = this._downAt;
    this._downAt = null;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
      return void 0;
    }
    const target = (
      /** @type {Element} */
      e.target
    );
    if (!target || typeof target.closest !== "function") return void 0;
    if (target.closest(".apexcharts-drilldown-target")) return void 0;
    if (target.closest(
      ".apexcharts-legend, .apexcharts-toolbar, .apexcharts-breadcrumb, .apexcharts-menu, .apexcharts-tooltip"
    )) {
      return void 0;
    }
    const i = w2.interact.capturedSeriesIndex;
    const j = w2.interact.capturedDataPointIndex;
    if (i == null || j == null || i < 0 || j < 0) return void 0;
    if (!this._isPointBasedSeries(w2.config.series[i])) return void 0;
    const point = this._pointAt(i, j);
    if (!point || typeof point !== "object" || point.drilldown == null) {
      return void 0;
    }
    return this.drillDown(point.drilldown, point, {
      seriesIndex: i,
      dataPointIndex: j
    });
  }
  /**
   * A series mark that is deliberately click-through. Restricted to markers
   * inside the plot: the tooltip draws its own `no-pointer-events` marker, and
   * that one must stay click-through or it would sit under the cursor and eat
   * the hover it exists to follow.
   * @param {Element} node
   * @returns {boolean}
   */
  _isClickThroughMark(node) {
    if (!node.classList || !node.classList.contains("no-pointer-events")) {
      return false;
    }
    if (!node.classList.contains("apexcharts-marker")) return false;
    return !(typeof node.closest === "function" && node.closest(".apexcharts-tooltip"));
  }
  /**
   * Discrete-marker entries that give each drillable point a visible dot.
   *
   * Only series drawn WITHOUT markers get them, so an author who already shows
   * markers keeps their styling untouched, and only drillable points get one, so
   * the dots read as "these are the ones you can open" rather than turning every
   * point into a dot. Core renders discrete markers even when `markers.size` is
   * 0, which is what makes the affordance possible without a core change.
   *
   * Entries are tagged so a resync replaces ours and leaves the author's alone.
   * @param {any[]} series - the series being rendered (a drill applies its
   *   level's series, which are not yet on `w.config` when this runs)
   * @returns {any[]}
   */
  _drillMarkers(series) {
    const w2 = this.w;
    const cfg = w2.config.drilldown;
    const authored = Array.isArray(w2.config.markers && w2.config.markers.discrete) ? w2.config.markers.discrete.filter(
      (d) => !d || !d[DRILL_MARKER]
    ) : [];
    const mk = cfg && cfg.marker || {};
    if (mk.show === false || !Array.isArray(series)) return authored;
    const own = [];
    series.forEach((s, i) => {
      if (!this._seriesNeedsDrillMarker(i, s)) return;
      const data = s && Array.isArray(s.data) ? s.data : null;
      if (!data) return;
      data.forEach((point, j) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const entry = { seriesIndex: i, dataPointIndex: j, [DRILL_MARKER]: true };
        if (mk.size !== void 0) entry.size = mk.size;
        if (mk.shape !== void 0) entry.shape = mk.shape;
        if (mk.fillColor !== void 0) entry.fillColor = mk.fillColor;
        if (mk.strokeColor !== void 0) entry.strokeColor = mk.strokeColor;
        own.push(entry);
      });
    });
    return authored.concat(own);
  }
  /**
   * Whether a series needs drill dots supplied for it: a point-based type whose
   * marks are the markers, drawn with markers off. Bar, pie, treemap and heatmap
   * marks are already real clickable elements, and a series that already shows
   * markers already has its affordance.
   * @param {number} i @param {any} s
   * @returns {boolean}
   */
  _seriesNeedsDrillMarker(i, s) {
    if (!this._isPointBasedSeries(s)) return false;
    const size = this.w.config.markers && this.w.config.markers.size;
    const effective = Array.isArray(size) ? size[i] : size;
    return !(Number(effective) > 0);
  }
  /**
   * A series whose marks are markers (a point), rather than a shape big enough
   * to aim at on its own.
   * @param {any} s
   * @returns {boolean}
   */
  _isPointBasedSeries(s) {
    const type = s && s.type || this.w.config.chart.type;
    return type === "line" || type === "area";
  }
}
_core__default.registerFeatures({ drilldown: Drilldown });
const REGISTRY_KEY = "__apexcharts_plugins__";
function getRegistry() {
  const g2 = (
    /** @type {any} */
    globalThis
  );
  if (!g2[REGISTRY_KEY]) g2[REGISTRY_KEY] = {};
  return g2[REGISTRY_KEY];
}
function getPlugin(name) {
  return getRegistry()[name] || null;
}
const WEAVE_API_VERSION = 1;
const PLUGIN_CHART_METHODS = [
  "updateOptions",
  "updateSeries",
  "appendData",
  "appendSeries",
  "toggleSeries",
  "showSeries",
  "hideSeries",
  "highlightSeries",
  "isSeriesHidden",
  "zoomX",
  "addXaxisAnnotation",
  "addYaxisAnnotation",
  "addPointAnnotation",
  "clearAnnotations",
  "removeAnnotation",
  "dataURI",
  "exportToCSV"
];
function buildBoundPublicMethods(ctx) {
  const out = {};
  PLUGIN_CHART_METHODS.forEach((m2) => {
    if (typeof ctx[m2] === "function") out[m2] = ctx[m2].bind(ctx);
  });
  return Object.freeze(out);
}
function makeLayerHandle(g2, graphics) {
  const add = (el) => {
    if (el) g2.add(el);
    return el;
  };
  const handle = {
    get node() {
      return g2.node;
    },
    /** @param {any} opts */
    path(opts = {}) {
      const {
        d = "",
        stroke = "#000",
        width = 1,
        fill = "none",
        opacity = 1,
        dash = 0,
        className = ""
      } = opts;
      return add(
        graphics.drawPath({
          d,
          stroke,
          strokeWidth: width,
          fill,
          fillOpacity: fill === "none" ? 0 : opacity,
          strokeOpacity: opacity,
          strokeDashArray: dash,
          classes: className
        })
      );
    },
    /** @param {any} opts */
    line(opts = {}) {
      const { x1, y1, x2, y2, stroke = "#000", width = 1, dash = 0 } = opts;
      return add(graphics.drawLine(x1, y1, x2, y2, stroke, dash, width));
    },
    /** @param {any} opts */
    rect(opts = {}) {
      const {
        x = 0,
        y = 0,
        w: w2 = 0,
        h = 0,
        r = 0,
        fill = "#000",
        stroke = null,
        opacity = 1
      } = opts;
      return add(
        graphics.drawRect(
          x,
          y,
          w2,
          h,
          r,
          fill,
          opacity,
          stroke != null ? 1 : null,
          stroke
        )
      );
    },
    /** @param {any} opts */
    circle(opts = {}) {
      const { cx = 0, cy = 0, r = 0, fill = "#000", stroke = null } = opts;
      return add(
        graphics.drawCircle(r, { cx, cy, fill, stroke: stroke || "none" })
      );
    },
    /** @param {any} opts */
    text(opts = {}) {
      const {
        x = 0,
        y = 0,
        text = "",
        color,
        size,
        anchor = "start",
        weight
      } = opts;
      return add(
        graphics.drawText({
          x,
          y,
          text,
          textAnchor: anchor,
          fontSize: size,
          foreColor: color,
          fontWeight: weight
        })
      );
    },
    clear() {
      const node = g2.node;
      while (node.firstChild) node.removeChild(node.firstChild);
      return handle;
    }
  };
  return handle;
}
function buildPluginAPI(host, record) {
  const ctx = host.ctx;
  const w2 = host.w;
  const api = {
    name: record.def.name,
    version: WEAVE_API_VERSION,
    // Live: reconcile refreshes record.options when the chart's plugins config
    // changes, so updateOptions({ plugins: [{ name, options }] }) reconfigures
    // an active plugin in place. The returned object is frozen.
    get options() {
      return record.options;
    },
    // ── lifecycle subscription ──
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    on(hook, fn) {
      const m2 = record.handlers;
      if (!m2.has(hook)) m2.set(hook, []);
      m2.get(hook).push(fn);
      return api;
    },
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    off(hook, fn) {
      const a = record.handlers.get(hook);
      if (a) {
        const i = a.indexOf(fn);
        if (i > -1) a.splice(i, 1);
      }
      return api;
    },
    // ── per-plugin, per-chart scratch state (survives updates, dropped on
    //    destroy). The api object is frozen, but this object is mutable. ──
    store: {},
    // ── drawing (renderer-agnostic) ──
    // Call this INSIDE each draw handler: the host wipes plugin layers at the
    // start of every draw pass, so a handle cached across draws points at a
    // detached node and its writes vanish silently.
    /** @param {any} [opts] */
    layer(opts) {
      return host._layer(record.def.name, opts || {});
    },
    // ── reads ──
    get scales() {
      return host._currentScales;
    },
    // Served from the per-dispatch snapshot when one exists (invalidated at
    // every dispatch), so reading api.data in a loop does not rebuild the
    // point arrays on each property access.
    get data() {
      return host._lastData || (host._lastData = host._dataSnapshot());
    },
    theme: Object.freeze({
      get mode() {
        return w2.config.theme.mode;
      },
      get foreColor() {
        return w2.config.chart.foreColor;
      },
      /** @param {number} i */
      seriesColor(i) {
        return w2.globals.colors[i];
      },
      /** @param {string} name */
      token(name) {
        return host._token(name);
      }
    }),
    // ── curated actions (bound public methods only; NEVER raw w) ──
    chart: buildBoundPublicMethods(ctx),
    // ── custom events out to the host app ──
    /**
     * Fires as `plugin:<pluginName>:<name>` on the chart's event bus. The
     * namespace is not optional: the bus also carries the internal lifecycle
     * events ('updated', 'mounted', ...), and an un-namespaced emit could
     * trigger every internal subscriber (history capture, re-render hooks).
     * Listen with chart.addEventListener('plugin:myplugin:myevent', fn).
     * @param {string} name
     * @param {any} [detail]
     */
    emit(name, detail) {
      ctx.events.fireEvent(`plugin:${record.def.name}:${name}`, [ctx, detail]);
    },
    // ── host element (read; lazy: baseEl is not set until render) ──
    get el() {
      return w2.dom.baseEl;
    }
  };
  return Object.freeze(api);
}
class WeaveHost {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    this.active = [];
    this._layers = /* @__PURE__ */ new Map();
    this._currentScales = null;
    this._lastPluginsRef = null;
    this._lastData = null;
    this._updatedWired = false;
    this._onUpdated = this._onUpdated.bind(this);
    this._init();
  }
  _init() {
    const list = this.w.config.plugins || [];
    list.map((entry, i) => ({
      entry,
      order: entry.order != null ? entry.order : i
    })).sort((a, b2) => a.order - b2.order).forEach((o) => this._activate(o.entry));
    this._lastPluginsRef = this.w.config.plugins;
    this._wireUpdated();
  }
  _wireUpdated() {
    if (this._updatedWired) return;
    this.ctx.addEventListener("updated", this._onUpdated);
    this._updatedWired = true;
  }
  _onUpdated() {
    this.dispatch("afterUpdate", { pass: "update" });
  }
  /**
   * @param {any} entry { name, options?, order? }
   */
  _activate(entry) {
    const def = getPlugin(entry.name);
    if (!def) {
      console.error(`[apexcharts] plugin "${entry.name}" is not registered.`);
      return;
    }
    const v2 = def.apiVersion != null ? def.apiVersion : 1;
    if (Math.trunc(v2) !== WEAVE_API_VERSION) {
      console.error(
        `[apexcharts] plugin "${def.name}" targets Weave API v${v2}, host is v${WEAVE_API_VERSION}; skipped.`
      );
      return;
    }
    const record = {
      def,
      options: Object.freeze(__spreadValues({}, entry.options || {})),
      handlers: /* @__PURE__ */ new Map(),
      disabled: false,
      failures: 0,
      api: null
    };
    record.api = buildPluginAPI(this, record);
    this.active.push(record);
    this._guard(record, "setup", () => def.setup(record.api));
  }
  /**
   * @param {string} hook
   * @param {{ pass?: string, xyRatios?: any }} [extra]
   */
  dispatch(hook, extra) {
    if (hook === "draw") {
      this._reconcile();
      this._resetLayers();
    }
    this._lastData = null;
    if (!this.active.length) return;
    if (hook === "afterParse") {
      this._currentScales = null;
    } else if (extra && "xyRatios" in extra) {
      this._setScales(extra.xyRatios);
    }
    const pass = extra && extra.pass || "full";
    let data = null;
    for (const record of this.active) {
      if (record.disabled) continue;
      const fns = record.handlers.get(hook);
      if (!fns || !fns.length) continue;
      if (data === null) {
        data = this._dataSnapshot();
        this._lastData = data;
      }
      const payload = {
        api: record.api,
        scales: this._currentScales,
        data,
        pass,
        hook
      };
      for (const fn of fns.slice()) {
        this._guard(record, hook, () => fn(payload));
      }
    }
  }
  /**
   * @param {any} record
   * @param {string} where
   * @param {Function} fn
   */
  _guard(record, where, fn) {
    if (record.disabled) return;
    try {
      fn();
    } catch (e) {
      console.error(
        `[apexcharts] plugin "${record.def.name}" threw in "${where}":`,
        e
      );
      record.failures = (record.failures || 0) + 1;
      if (record.failures >= 3) {
        record.disabled = true;
        console.error(
          `[apexcharts] plugin "${record.def.name}" disabled after repeated errors.`
        );
      }
    }
  }
  // ─── Scales facade ──────────────────────────────────────────────────────
  /**
   * Build api.scales from the SAME xyRatios the series were drawn with, so
   * plugin pixels align with series pixels by construction.
   * @param {any} xyRatios
   */
  _setScales(xyRatios) {
    const w2 = this.w;
    const gl = w2.globals;
    const L2 = w2.layout;
    if (!xyRatios || !gl.axisCharts) {
      this._currentScales = null;
      return;
    }
    const xRatio = xyRatios.xRatio;
    const yRatio = xyRatios.yRatio || [];
    const yr = (axis) => yRatio[axis] != null ? yRatio[axis] : yRatio[0];
    const maxY = (axis) => gl.maxYArr[axis] != null ? gl.maxYArr[axis] : gl.maxY;
    const minY = (axis) => gl.minYArr[axis] != null ? gl.minYArr[axis] : gl.minY;
    this._currentScales = {
      /** @param {number} v */
      x: (v2) => L2.translateX + (v2 - gl.minX) / xRatio,
      /**
       * @param {number} v
       * @param {number} [axis]
       */
      y: (v2, axis = 0) => L2.translateY + (maxY(axis) - v2) / yr(axis),
      domainX: [gl.minX, gl.maxX],
      /** @param {number} [axis] */
      domainY: (axis = 0) => [minY(axis), maxY(axis)],
      gridWidth: L2.gridWidth,
      gridHeight: L2.gridHeight,
      ratios: xyRatios
    };
  }
  // ─── Read-only data snapshot ────────────────────────────────────────────
  /**
   * @returns {any[]} defensive per-series snapshot (never the live slice)
   */
  _dataSnapshot() {
    const w2 = this.w;
    const gl = w2.globals;
    const series = w2.seriesData.series || [];
    const seriesX = w2.seriesData.seriesX || [];
    return series.map((sData, i) => {
      const xs = seriesX[i] || [];
      const points = (sData || []).map((y, j) => ({
        x: xs[j] != null ? xs[j] : j,
        y
      }));
      return {
        name: gl.seriesNames ? gl.seriesNames[i] : void 0,
        hidden: (gl.collapsedSeriesIndices || []).includes(i),
        color: gl.colors ? gl.colors[i] : void 0,
        points
      };
    });
  }
  // ─── Theme tokens ───────────────────────────────────────────────────────
  /**
   * @param {string} name
   * @returns {any}
   */
  _token(name) {
    const w2 = this.w;
    const gl = w2.globals;
    switch (name) {
      case "foreColor":
        return w2.config.chart.foreColor;
      case "background":
        return w2.config.chart.background;
      case "accent":
      case "primary":
        return gl.colors ? gl.colors[0] : void 0;
      default:
        if (/^series-\d+$/.test(name)) {
          return gl.colors ? gl.colors[Number(name.split("-")[1])] : void 0;
        }
        return void 0;
    }
  }
  // ─── Layers ─────────────────────────────────────────────────────────────
  /**
   * @param {string} name
   * @param {{ z?: 'front'|'behind', className?: string }} opts
   */
  _layer(name, { z = "front", className = "" } = {}) {
    let g2 = this._layers.get(name);
    if (!g2) {
      g2 = this.ctx.graphics.group({
        class: `apexcharts-plugin-${name} ${className}`.trim()
      });
      const parent = this.w.dom.elGraphical.node;
      if (z === "behind") parent.insertBefore(g2.node, parent.firstChild);
      else parent.appendChild(g2.node);
      g2.node.setAttribute("aria-hidden", "true");
      this._layers.set(name, g2);
    }
    return makeLayerHandle(g2, this.ctx.graphics);
  }
  /**
   * Remove all plugin layers. Run at the start of every `draw` because
   * fastUpdate only removes series/data-label groups (not arbitrary plugin
   * groups), so without this, fast-path redraws would duplicate plugin output.
   */
  _resetLayers() {
    const el = this.w.dom.elGraphical;
    const parent = el && el.node;
    if (parent) {
      const groups = parent.querySelectorAll('g[class*="apexcharts-plugin-"]');
      Array.prototype.forEach.call(groups, (n) => n.remove());
    }
    this._layers.clear();
  }
  // ─── Config-change reconciliation ───────────────────────────────────────
  /**
   * Diff w.config.plugins by name: teardown removed, activate added; unchanged
   * plugins keep their instance + store, but their `options` are refreshed from
   * the new entry (api.options is a live getter), so
   * updateOptions({ plugins: [{ name, options }] }) reconfigures in place.
   * Skipped when the plugins array reference is unchanged (fast redraws), so it
   * costs nothing on hover.
   */
  _reconcile() {
    const plugins = this.w.config.plugins || [];
    if (plugins === this._lastPluginsRef) return;
    this._lastPluginsRef = plugins;
    const desired = new Map(
      plugins.map((e, i) => [
        e.name,
        { entry: e, order: e.order != null ? e.order : i }
      ])
    );
    for (let i = this.active.length - 1; i >= 0; i--) {
      const r = this.active[i];
      const want = desired.get(r.def.name);
      if (!want) {
        this._guard(r, "destroy", () => r.def.destroy && r.def.destroy(r.api));
        this.active.splice(i, 1);
      } else {
        r.options = Object.freeze(__spreadValues({}, want.entry.options || {}));
      }
    }
    const activeNames = new Set(this.active.map((r) => r.def.name));
    const toAdd = [];
    desired.forEach((v2, name) => {
      if (!activeNames.has(name)) toAdd.push(v2);
    });
    toAdd.sort((a, b2) => a.order - b2.order).forEach((v2) => this._activate(v2.entry));
  }
  /**
   * @param {boolean} [isUpdating]
   */
  teardown(isUpdating) {
    if (!isUpdating) {
      this.dispatch("destroy");
      for (const record of this.active) {
        this._guard(record, "destroy", () => record.def.destroy && record.def.destroy(record.api));
      }
      this.active = [];
      if (this._updatedWired) {
        this.ctx.removeEventListener && this.ctx.removeEventListener("updated", this._onUpdated);
        this._updatedWired = false;
      }
    }
    this._layers.clear();
  }
}
_core__default.registerFeatures({ weave: WeaveHost });
function seriesEmitter(ctx, graphics) {
  const r = ctx && ctx.renderer;
  return r && r.kind && r.kind !== "svg" ? r : graphics;
}
function makeCustomSeriesClass(name, def) {
  const cls = class CustomSeries {
    /**
     * @param {any} w @param {any} ctx @param {any} xyRatios
     */
    constructor(w2, ctx, xyRatios) {
      this.w = w2;
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
      const w2 = this.w;
      const graphics = new Graphics(w2, this.ctx);
      const emit = seriesEmitter(this.ctx, graphics);
      const ret = graphics.group({ class: "apexcharts-marks-series" });
      series.forEach((_s, idx) => {
        var _a2;
        const realIndex = Array.isArray(seriesIndices) ? seriesIndices[idx] : idx;
        const elSeries = graphics.group({
          class: "apexcharts-series",
          rel: realIndex + 1,
          seriesName: Utils.escapeString(w2.seriesData.seriesNames[realIndex]),
          "data:realIndex": realIndex
        });
        const scales = this._scales(
          realIndex,
          (w2.seriesData.series[realIndex] || []).length
        );
        const color = w2.globals.colors[realIndex];
        const rawData = (
          /** @type {any} */
          ((_a2 = w2.config.series[realIndex]) == null ? void 0 : _a2.data) || []
        );
        const xvals = w2.seriesData.seriesX[realIndex] || [];
        const yvals = w2.seriesData.series[realIndex] || [];
        w2.globals.seriesXvalues[realIndex] = [];
        w2.globals.seriesYvalues[realIndex] = [];
        if (typeof w2.globals.pointsArray[realIndex] === "undefined") {
          w2.globals.pointsArray[realIndex] = [];
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
          w2.globals.seriesXvalues[realIndex][j] = xPx;
          w2.globals.seriesYvalues[realIndex][j] = yPx;
          w2.globals.pointsArray[realIndex][j] = [xPx, yPx];
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
      const x = (v2) => xRatio ? (v2 - gl.minX) / xRatio : gridWidth / 2;
      const y = (v2) => (maxY - v2) / yr;
      const xAt = (index, v2) => {
        if (!catMode) return x(v2);
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
const DARK_QUERY = "(prefers-color-scheme: dark)";
const CONTRAST_QUERY = "(prefers-contrast: more)";
class OSThemeWatcher {
  /**
   * @param {any} w @param {any} ctx
   */
  constructor(w2, ctx) {
    this.w = w2;
    this.ctx = ctx;
    if (w2.config.theme.follow !== "os" || !Environment.isBrowser()) return;
    const media = this._ensureMedia();
    if (!media) return;
    this._applyToConfig(media);
    this._ensureListeners(media);
  }
  /**
   * Create (once per instance) the MediaQueryLists and stash them on `ctx` so
   * they persist across the re-render that `updateOptions` triggers.
   * @returns {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}|null}
   */
  _ensureMedia() {
    if (!this.ctx._osThemeMedia) {
      const dark = BrowserAPIs.matchMedia(DARK_QUERY);
      const contrast = BrowserAPIs.matchMedia(CONTRAST_QUERY);
      if (!dark && !contrast) return null;
      this.ctx._osThemeMedia = { dark, contrast, handler: null };
    }
    return this.ctx._osThemeMedia;
  }
  /**
   * Write the OS-resolved mode / high-contrast onto the live `w.config.theme`.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null}} media
   */
  _applyToConfig(media) {
    const theme = this.w.config.theme;
    if (media.dark) {
      theme.mode = media.dark.matches ? "dark" : "light";
    }
    if (media.contrast && media.contrast.matches) {
      theme.accessibility = theme.accessibility || {};
      theme.accessibility.colorBlindMode = "highContrast";
    }
  }
  /**
   * Attach the `change` listener once. The handler closes over `ctx` + `media`
   * (both stable across re-renders), NOT over `this` (a fresh watcher is built
   * each create), so it never goes stale.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}} media
   */
  _ensureListeners(media) {
    if (media.handler) return;
    const ctx = this.ctx;
    const handler = () => {
      const m2 = ctx._osThemeMedia;
      if (!m2) return;
      const themeOpt = { mode: m2.dark && m2.dark.matches ? "dark" : "light" };
      if (m2.contrast && m2.contrast.matches) {
        themeOpt.accessibility = { colorBlindMode: "highContrast" };
      } else {
        themeOpt.accessibility = { colorBlindMode: "" };
      }
      ctx.updateOptions({ theme: themeOpt }, false, true, false);
    };
    OSThemeWatcher._add(media.dark, handler);
    OSThemeWatcher._add(media.contrast, handler);
    media.handler = handler;
  }
  /** Remove the listeners and drop the stashed media. Called on full destroy. */
  teardown() {
    const media = this.ctx._osThemeMedia;
    if (!media) return;
    if (media.handler) {
      OSThemeWatcher._remove(media.dark, media.handler);
      OSThemeWatcher._remove(media.contrast, media.handler);
    }
    this.ctx._osThemeMedia = null;
  }
  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _add(mql, handler) {
    if (!mql) return;
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof /** @type {any} */
    mql.addListener === "function") {
      mql.addListener(handler);
    }
  }
  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _remove(mql, handler) {
    if (!mql) return;
    if (typeof mql.removeEventListener === "function") {
      mql.removeEventListener("change", handler);
    } else if (typeof /** @type {any} */
    mql.removeListener === "function") {
      mql.removeListener(handler);
    }
  }
}
_core__default.registerFeatures({ osThemeWatcher: OSThemeWatcher });
const TRANSFORM_KEY = "__apexcharts_series_transforms__";
if (!/** @type {any} */
globalThis[TRANSFORM_KEY]) {
  globalThis[TRANSFORM_KEY] = {};
}
function getTransforms() {
  return (
    /** @type {any} */
    globalThis[TRANSFORM_KEY]
  );
}
function registerSeriesTransform(name, fn) {
  if (!name || typeof name !== "string") {
    console.warn(
      "ApexCharts: registerSeriesTransform requires a non-empty name."
    );
    return;
  }
  if (typeof fn !== "function") {
    console.warn(
      `ApexCharts: registerSeriesTransform("${name}") expects a function (series, w) => series.`
    );
    return;
  }
  getTransforms()[name] = fn;
}
const ROW_SOURCE_KEY = "__apexcharts_row_sources__";
if (!/** @type {any} */
globalThis[ROW_SOURCE_KEY]) {
  globalThis[ROW_SOURCE_KEY] = {};
}
function getSources() {
  return (
    /** @type {any} */
    globalThis[ROW_SOURCE_KEY]
  );
}
function registerRowSource(name, fn) {
  if (!name || typeof name !== "string") {
    console.warn("ApexCharts: registerRowSource requires a non-empty name.");
    return;
  }
  if (typeof fn !== "function") {
    console.warn(
      `ApexCharts: registerRowSource("${name}") expects a function (w, opts) => series.`
    );
    return;
  }
  getSources()[name] = fn;
}
const MAX_BINS = 1e3;
function quantileSorted(sorted, q) {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
function stdDev(values) {
  const n = values.length;
  if (n < 2) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += values[i];
  const mean = sum / n;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean;
    acc += d * d;
  }
  return Math.sqrt(acc / n);
}
function widthForRule(sorted, span, rule) {
  const n = sorted.length;
  const byCount = (count) => span / Math.max(1, Math.ceil(count));
  switch (rule) {
    case "sqrt":
      return { width: byCount(Math.sqrt(n)), rule: "sqrt" };
    case "rice":
      return { width: byCount(2 * Math.cbrt(n)), rule: "rice" };
    case "scott": {
      const sd = stdDev(sorted);
      if (sd > 0) return { width: 3.49 * sd * Math.pow(n, -1 / 3), rule: "scott" };
      return { width: byCount(Math.log2(n) + 1), rule: "sturges" };
    }
    case "fd": {
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
      if (iqr > 0) return { width: 2 * iqr * Math.pow(n, -1 / 3), rule: "fd" };
      return { width: byCount(Math.log2(n) + 1), rule: "sturges" };
    }
    case "auto": {
      const sturges = byCount(Math.log2(n) + 1);
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
      if (iqr <= 0) return { width: sturges, rule: "sturges" };
      const fd = 2 * iqr * Math.pow(n, -1 / 3);
      return fd < sturges ? { width: fd, rule: "fd" } : { width: sturges, rule: "sturges" };
    }
    case "sturges":
    default:
      return { width: byCount(Math.log2(n) + 1), rule: "sturges" };
  }
}
function computeBinning(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b2) => a - b2);
  let lo = sorted[0];
  let hi = sorted[sorted.length - 1];
  const range = opts.range;
  if (Array.isArray(range) && range.length === 2) {
    const rLo = Number(range[0]);
    const rHi = Number(range[1]);
    if (isFinite(rLo) && isFinite(rHi) && rHi > rLo) {
      lo = rLo;
      hi = rHi;
    }
  }
  if (!(hi > lo)) {
    const pad = Math.abs(lo) > 0 ? Math.abs(lo) * 0.05 : 0.5;
    return {
      edges: [lo - pad, lo + pad],
      binWidth: pad * 2,
      rule: "single",
      capped: false
    };
  }
  const span = hi - lo;
  let width;
  let rule;
  if (typeof opts.binWidth === "number" && opts.binWidth > 0) {
    width = opts.binWidth;
    rule = "binWidth";
  } else if (typeof opts.bins === "number" && opts.bins >= 1) {
    width = span / Math.floor(opts.bins);
    rule = "count";
  } else {
    const chosen = widthForRule(
      sorted,
      span,
      typeof opts.bins === "string" ? opts.bins : "auto"
    );
    width = chosen.width;
    rule = chosen.rule;
  }
  if (!isFinite(width) || width <= 0) width = span;
  let count = Math.ceil(span / width);
  if (!isFinite(count) || count < 1) count = 1;
  let capped = false;
  if (count > MAX_BINS) {
    count = MAX_BINS;
    width = span / count;
    capped = true;
  }
  width = span / count;
  const edges = new Array(count + 1);
  for (let k = 0; k <= count; k++) edges[k] = lo + k * width;
  edges[count] = Math.max(edges[count], hi);
  return { edges, binWidth: width, rule, capped };
}
function binIndexOf(v2, edges) {
  const last = edges.length - 1;
  if (!(v2 >= edges[0]) || v2 > edges[last]) return -1;
  if (v2 === edges[last]) return last - 1;
  const width = (edges[last] - edges[0]) / last;
  if (width > 0) {
    let k = Math.floor((v2 - edges[0]) / width);
    if (k < 0) k = 0;
    if (k > last - 1) k = last - 1;
    if (v2 < edges[k]) k--;
    else if (v2 >= edges[k + 1]) k++;
    if (k < 0 || k > last - 1) return -1;
    return k;
  }
  let lo = 0;
  let hi = last - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    if (v2 < edges[mid]) hi = mid - 1;
    else if (v2 >= edges[mid + 1]) lo = mid + 1;
    else return mid;
  }
  return -1;
}
function binCounts(values, edges) {
  const counts = new Array(Math.max(0, edges.length - 1)).fill(0);
  for (let i = 0; i < values.length; i++) {
    const k = binIndexOf(values[i], edges);
    if (k >= 0) counts[k]++;
  }
  return counts;
}
function rowsByBin(values, edges) {
  const n = Math.max(0, edges.length - 1);
  const buckets = new Array(n);
  for (let k = 0; k < n; k++) buckets[k] = [];
  for (let i = 0; i < values.length; i++) {
    const k = binIndexOf(values[i], edges);
    if (k >= 0) buckets[k].push(values[i]);
  }
  return buckets;
}
function fiveNumberSummary(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b2) => a - b2);
  const q1 = quantileSorted(sorted, 0.25);
  const median = quantileSorted(sorted, 0.5);
  const q3 = quantileSorted(sorted, 0.75);
  const iqr = q3 - q1;
  let lo = sorted[0];
  let hi = sorted[sorted.length - 1];
  let outliers = [];
  if (opts.whiskers === "tukey" && iqr > 0) {
    const loFence = q1 - 1.5 * iqr;
    const hiFence = q3 + 1.5 * iqr;
    let i = 0;
    while (i < sorted.length && sorted[i] < loFence) i++;
    let j = sorted.length - 1;
    while (j >= 0 && sorted[j] > hiFence) j--;
    if (i <= j) {
      lo = sorted[i];
      hi = sorted[j];
      outliers = sorted.slice(0, i).concat(sorted.slice(j + 1));
    }
  }
  return { summary: [lo, q1, median, q3, hi], outliers, iqr };
}
function kernelDensity(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b2) => a - b2);
  const n = sorted.length;
  let h = opts.bandwidth;
  if (!(typeof h === "number" && h > 0)) {
    const sd = stdDev(sorted);
    const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
    const spread = iqr > 0 ? Math.min(sd, iqr / 1.349) : sd;
    h = 0.9 * spread * Math.pow(n, -1 / 5);
  }
  if (!isFinite(h) || h <= 0) {
    const v2 = sorted[0];
    const eps = Math.abs(v2) > 0 ? Math.abs(v2) * 1e-3 : 1e-3;
    return {
      density: [
        [v2 - eps, 0],
        [v2, 1],
        [v2 + eps, 0]
      ],
      bandwidth: eps
    };
  }
  const steps = Math.max(8, Math.floor(opts.resolution || 64));
  const lo = sorted[0] - 2 * h;
  const hi = sorted[n - 1] + 2 * h;
  const step = (hi - lo) / (steps - 1);
  const norm = 1 / (n * h * Math.sqrt(2 * Math.PI));
  const density = [];
  for (let g2 = 0; g2 < steps; g2++) {
    const x = lo + g2 * step;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const z = (x - sorted[i]) / h;
      sum += Math.exp(-0.5 * z * z);
    }
    density.push([x, sum * norm]);
  }
  return { density, bandwidth: h };
}
function normalizeCounts(counts, opts = {}) {
  let out = counts.slice();
  if (opts.cumulative) {
    let acc = 0;
    out = out.map((c) => acc += c);
  }
  const total = counts.reduce((a, b2) => a + b2, 0);
  if (total <= 0) return out;
  if (opts.normalize === "relative") {
    return out.map((c) => c / total * 100);
  }
  if (opts.normalize === "density") {
    const w2 = opts.binWidth;
    if (typeof w2 === "number" && w2 > 0) return out.map((c) => c / (total * w2));
  }
  return out;
}
function histogramValues(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    let raw = d;
    if (Array.isArray(d)) raw = d.length === 1 ? d[0] : d[1];
    else if (d && typeof d === "object") raw = d.y !== void 0 ? d.y : d.x;
    const v2 = Utils.parseNumber(raw);
    if (v2 !== null && isFinite(v2)) out.push(v2);
  }
  return out;
}
function histogramTransform(ser, w2) {
  var _a;
  const cnf = w2.config;
  const gl = w2.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.histogramRawSeries) {
    gl.histogramRawSeries = ser.map((s) => __spreadProps(__spreadValues({}, s), {
      data: Array.isArray(s == null ? void 0 : s.data) ? s.data.slice() : s == null ? void 0 : s.data
    }));
  }
  const raw = gl.histogramRawSeries;
  const hcfg = ((_a = cnf.plotOptions) == null ? void 0 : _a.histogram) || {};
  const perSeries = raw.map((s) => histogramValues(s == null ? void 0 : s.data));
  let all = [];
  if (perSeries.length === 1) {
    all = perSeries[0];
  } else {
    for (const vals of perSeries) all = all.concat(vals);
  }
  const binning = computeBinning(all, {
    bins: hcfg.bins,
    binWidth: hcfg.binWidth,
    range: hcfg.range
  });
  if (!binning) {
    w2.histogramData = {
      edges: [],
      binWidth: 0,
      counts: [],
      rule: "",
      capped: false
    };
    return raw;
  }
  const { edges, binWidth } = binning;
  const counts = perSeries.map(
    (vals) => binCounts(vals, edges)
  );
  w2.histogramData = {
    edges,
    binWidth,
    counts,
    rule: binning.rule,
    capped: binning.capped
  };
  const collapsed = gl.collapsedSeriesIndices || [];
  return raw.map((s, i) => {
    if (collapsed.indexOf(i) !== -1) return __spreadProps(__spreadValues({}, s), { data: [] });
    const ys = normalizeCounts(counts[i], {
      normalize: hcfg.normalize,
      cumulative: hcfg.cumulative,
      binWidth
    });
    const data = [];
    for (let k = 0; k < ys.length; k++) {
      data.push({ x: (edges[k] + edges[k + 1]) / 2, y: ys[k] });
    }
    return __spreadProps(__spreadValues({}, s), { data });
  });
}
const derivedData = /* @__PURE__ */ new WeakSet();
function observationsOf(d, allowFlatY) {
  var _a;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  let raw = null;
  if (Array.isArray(d.points)) raw = d.points;
  else if (Array.isArray((_a = d.y) == null ? void 0 : _a.points)) raw = d.y.points;
  else if (allowFlatY && Array.isArray(d.y) && typeof d.y[0] === "number") {
    raw = d.y;
  }
  if (!raw) return null;
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const v2 = Utils.parseNumber(raw[i]);
    if (v2 !== null && isFinite(v2)) out.push(v2);
  }
  return out.length ? out : null;
}
function boxPlotTransform(ser, w2) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const whiskers = ((_b = (_a = w2.config.plotOptions) == null ? void 0 : _a.boxPlot) == null ? void 0 : _b.whiskers) || "minmax";
  return ser.map((s) => {
    if (!Array.isArray(s == null ? void 0 : s.data)) return s;
    let touched = false;
    const data = s.data.map((d) => {
      if (Array.isArray(d == null ? void 0 : d.y) && d.y.length === 5 && !derivedData.has(d)) {
        return d;
      }
      const values = observationsOf(d, false);
      if (!values) return d;
      const summary = fiveNumberSummary(values, { whiskers });
      if (!summary) return d;
      touched = true;
      const next = __spreadProps(__spreadValues({}, d), { y: summary.summary, points: values });
      derivedData.add(next);
      return next;
    });
    return touched ? __spreadProps(__spreadValues({}, s), { data }) : s;
  });
}
function violinTransform(ser, w2) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const kde = ((_b = (_a = w2.config.plotOptions) == null ? void 0 : _a.violin) == null ? void 0 : _b.kde) || {};
  return ser.map((s) => {
    if (!Array.isArray(s == null ? void 0 : s.data)) return s;
    let touched = false;
    const data = s.data.map((d) => {
      var _a2;
      if (Array.isArray((_a2 = d == null ? void 0 : d.y) == null ? void 0 : _a2.density) && d.y.density.length && !derivedData.has(d)) {
        return d;
      }
      const values = observationsOf(d, true);
      if (!values) return d;
      const est = kernelDensity(values, {
        bandwidth: kde.bandwidth,
        resolution: kde.resolution
      });
      if (!est) return d;
      touched = true;
      const next = __spreadProps(__spreadValues({}, d), { y: { density: est.density, points: values } });
      derivedData.add(next);
      return next;
    });
    return touched ? __spreadProps(__spreadValues({}, s), { data }) : s;
  });
}
const DEFAULT_MAX_ROWS = 3e3;
function thinClusters(clusters, maxRows) {
  let total = 0;
  let widest = 0;
  for (const c of clusters) {
    total += c.length;
    if (c.length > widest) widest = c.length;
  }
  if (total <= maxRows) return { clusters, stride: 1, total, kept: total };
  const keptAt = (s) => {
    let n = 0;
    for (const c of clusters) n += Math.ceil(c.length / s);
    return n;
  };
  let stride = Math.max(2, Math.ceil(total / maxRows));
  while (stride < widest && keptAt(stride) > maxRows) stride++;
  let kept = 0;
  const out = clusters.map((rows) => {
    const keepList = [];
    for (let i = 0; i < rows.length; i += stride) keepList.push(rows[i]);
    kept += keepList.length;
    return keepList;
  });
  return { clusters: out, stride, total, kept };
}
function toUnitSeries(w2, clusters, opts) {
  const maxRows = opts && opts.maxRows != null ? opts.maxRows : DEFAULT_MAX_ROWS;
  const thinned = thinClusters(
    clusters.map((c) => c.rows),
    maxRows
  );
  if (thinned.stride > 1) {
    console.warn(
      `ApexCharts: rowSeries() thinned ${thinned.total} rows to ${thinned.kept} (every ${thinned.stride}${thinned.stride === 2 ? "nd" : thinned.stride === 3 ? "rd" : "th"} row) to stay under maxRows=${maxRows}. Raise maxRows to draw more.`
    );
  }
  const colors = w2.globals && w2.globals.colors || [];
  return clusters.map((c, i) => {
    const fillColor = colors[c.realIndex] || colors[0];
    return {
      name: c.name,
      data: thinned.clusters[i].map((v2, q) => __spreadValues({
        id: `${c.realIndex}:${i}:${q}`,
        x: c.name,
        y: v2
      }, fillColor ? { fillColor } : {}))
    };
  });
}
function histogramRows(w2, opts) {
  const gl = w2.globals;
  const hd = w2.histogramData;
  const raw = gl && gl.histogramRawSeries;
  if (!hd || !Array.isArray(hd.edges) || hd.edges.length < 2) return null;
  if (!Array.isArray(raw) || !raw.length) return null;
  const collapsed = gl && gl.collapsedSeriesIndices || [];
  const edges = hd.edges;
  const clusters = [];
  raw.forEach((s, i) => {
    var _a;
    if (collapsed.indexOf(i) !== -1) return;
    const buckets = rowsByBin(histogramValues(s && s.data), edges);
    const seriesName = w2.seriesData && ((_a = w2.seriesData.seriesNames) == null ? void 0 : _a[i]) || (s == null ? void 0 : s.name);
    buckets.forEach((rows, k) => {
      const range = `${formatEdge(edges[k])}-${formatEdge(edges[k + 1])}`;
      clusters.push({
        // Only qualify by series when there is more than one to tell apart.
        name: raw.length > 1 && seriesName ? `${seriesName} ${range}` : range,
        realIndex: i,
        rows
      });
    });
  });
  return clusters.length ? toUnitSeries(w2, clusters, opts) : null;
}
function formatEdge(v2) {
  if (!isFinite(v2)) return String(v2);
  const r = Math.round(v2);
  return Math.abs(v2 - r) < 1e-6 ? String(r) : String(Number(v2.toFixed(2)));
}
function pointsRowSource(pick) {
  return (w2, opts) => {
    var _a;
    const perSeries = pick(w2);
    if (!Array.isArray(perSeries) || !perSeries.length) return null;
    const collapsed = w2.globals && w2.globals.collapsedSeriesIndices || [];
    const labels = w2.globals && (((_a = w2.globals.categoryLabels) == null ? void 0 : _a.length) ? w2.globals.categoryLabels : w2.globals.labels) || [];
    const clusters = [];
    perSeries.forEach((byCat, i) => {
      var _a2;
      if (collapsed.indexOf(i) !== -1) return;
      if (!Array.isArray(byCat)) return;
      const seriesName = w2.seriesData && ((_a2 = w2.seriesData.seriesNames) == null ? void 0 : _a2[i]);
      byCat.forEach((pts, j) => {
        const label = labels[j] != null ? String(labels[j]) : `#${j + 1}`;
        clusters.push({
          name: perSeries.length > 1 && seriesName ? `${seriesName} ${label}` : label,
          realIndex: i,
          rows: Array.isArray(pts) ? pts.slice() : []
        });
      });
    });
    return clusters.length ? toUnitSeries(w2, clusters, opts) : null;
  };
}
const boxPlotRows = pointsRowSource((w2) => {
  var _a;
  return (_a = w2.candleData) == null ? void 0 : _a.seriesBoxPoints;
});
const violinRows = pointsRowSource((w2) => {
  var _a;
  return (_a = w2.violinData) == null ? void 0 : _a.seriesViolinPoints;
});
registerSeriesTransform("histogram", histogramTransform);
registerSeriesTransform("boxPlot", boxPlotTransform);
registerSeriesTransform("violin", violinTransform);
registerRowSource("histogram", histogramRows);
registerRowSource("boxPlot", boxPlotRows);
registerRowSource("violin", violinRows);
const resolveDataLabelOffset = (value, w2, seriesIndex, dataPointIndex) => {
  if (typeof value !== "function") return value;
  const resolved = value({
    series: w2.seriesData.series,
    seriesIndex,
    dataPointIndex,
    w: w2
  });
  return Number.isFinite(resolved) ? resolved : 0;
};
function easeInOutSine(t) {
  return -Math.cos(t * Math.PI) / 2 + 0.5;
}
function cubicBezier(x1, y1, x2, y2) {
  x1 = Math.min(Math.max(x1, 0), 1);
  x2 = Math.min(Math.max(x2, 0), 1);
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const solveT = (x) => {
    let lo = 0;
    let hi = 1;
    let t = x;
    if (t < lo) return lo;
    if (t > hi) return hi;
    while (lo < hi) {
      const xt = sampleX(t);
      if (Math.abs(xt - x) < 1e-4) return t;
      if (x > xt) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (t) => t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solveT(t));
}
const REGISTRY = /* @__PURE__ */ new Map();
const linear = (t) => t;
REGISTRY.set("linear", linear);
REGISTRY.set("easeInOutSine", easeInOutSine);
REGISTRY.set("easeInSine", (t) => 1 - Math.cos(t * Math.PI / 2));
REGISTRY.set("easeOutSine", (t) => Math.sin(t * Math.PI / 2));
REGISTRY.set("easeInQuad", (t) => t * t);
REGISTRY.set("easeOutQuad", (t) => 1 - (1 - t) * (1 - t));
REGISTRY.set(
  "easeInOutQuad",
  (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
);
REGISTRY.set("easeInCubic", (t) => t * t * t);
REGISTRY.set("easeOutCubic", (t) => 1 - Math.pow(1 - t, 3));
REGISTRY.set(
  "easeInOutCubic",
  (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
);
REGISTRY.set("easeOutBack", (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
});
REGISTRY.set("easeInOutBack", (t) => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
});
function isBezierArray(v2) {
  return Array.isArray(v2) && v2.length === 4 && v2.every((n) => typeof n === "number");
}
function resolveEasing(value) {
  if (typeof value === "function") return guardEasing(value);
  if (isBezierArray(value))
    return cubicBezier(value[0], value[1], value[2], value[3]);
  if (typeof value === "string" && REGISTRY.has(value)) {
    return guardEasing(
      /** @type {(t:number)=>number} */
      REGISTRY.get(value)
    );
  }
  return easeInOutSine;
}
function guardEasing(fn) {
  return (t) => {
    const y = fn(t);
    return typeof y === "number" && isFinite(y) ? y : t;
  };
}
function buildUnionEntries(join, oldN) {
  const exitSet = new Set(join.exits);
  const entries = [];
  let oi = 0;
  for (let nj = 0; nj < join.toOld.length; nj++) {
    const oj = join.toOld[nj];
    if (oj !== -1) {
      while (oi < oj) {
        if (exitSet.has(oi)) entries.push({ oldJ: oi, newJ: -1 });
        oi++;
      }
      entries.push({ oldJ: oj, newJ: nj });
      oi = oj + 1;
    } else {
      entries.push({ oldJ: -1, newJ: nj });
    }
  }
  while (oi < oldN) {
    if (exitSet.has(oi)) entries.push({ oldJ: oi, newJ: -1 });
    oi++;
  }
  return entries;
}
function analyzeSeriesPath(d, expectedAnchors, isArea) {
  if (!d || typeof d !== "string") return null;
  const cmds = parsePath(d);
  if (!cmds.length || cmds[0][0] !== "M") return null;
  for (let i = 1; i < cmds.length; i++) {
    if (cmds[i][0] === "M") return null;
  }
  let body = cmds;
  let closing = null;
  if (isArea) {
    if (cmds.length < 5) return null;
    closing = cmds.slice(-3);
    body = cmds.slice(0, -3);
    if (closing[2][0] !== "Z") return null;
    if (closing[1][0] !== "L") return null;
    if (closing[0][0] !== "L" && closing[0][0] !== "C") return null;
  } else if (cmds[cmds.length - 1][0] === "Z") {
    return null;
  }
  if (body.length !== expectedAnchors || body.length < 2) return null;
  const segType = body[1][0];
  if (segType !== "L" && segType !== "C") return null;
  for (let i = 2; i < body.length; i++) {
    if (body[i][0] !== segType) return null;
  }
  const anchors = body.map(
    (c) => c[0] === "C" ? [Number(c[5]), Number(c[6])] : [Number(c[1]), Number(c[2])]
  );
  for (const a of anchors) {
    if (!isFinite(a[0]) || !isFinite(a[1])) return null;
  }
  return { body, closing, segType, anchors };
}
function lerpPt(a, b2, t) {
  return [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t];
}
function splitCubic(s, cmd, t) {
  const p0 = s;
  const p1 = [cmd[1], cmd[2]];
  const p2 = [cmd[3], cmd[4]];
  const p3 = [cmd[5], cmd[6]];
  const p01 = lerpPt(p0, p1, t);
  const p12 = lerpPt(p1, p2, t);
  const p23 = lerpPt(p2, p3, t);
  const p012 = lerpPt(p01, p12, t);
  const p123 = lerpPt(p12, p23, t);
  const mid = lerpPt(p012, p123, t);
  return {
    first: ["C", p01[0], p01[1], p012[0], p012[1], mid[0], mid[1]],
    second: ["C", p123[0], p123[1], p23[0], p23[1], p3[0], p3[1]],
    mid
  };
}
function splitLine(s, cmd, t) {
  const e = [cmd[1], cmd[2]];
  const mid = lerpPt(s, e, t);
  return {
    first: ["L", mid[0], mid[1]],
    second: ["L", e[0], e[1]],
    mid
  };
}
function expandPath(analysis, ownIdx) {
  const { body, closing, segType, anchors } = analysis;
  const n = anchors.length;
  const m2 = ownIdx.length;
  const degen = (p2) => segType === "C" ? ["C", p2[0], p2[1], p2[0], p2[1], p2[0], p2[1]] : ["L", p2[0], p2[1]];
  const out = [["M", anchors[0][0], anchors[0][1]]];
  let firstOwn = 0;
  while (firstOwn < m2 && ownIdx[firstOwn] !== 0) firstOwn++;
  for (let q = 1; q <= firstOwn; q++) out.push(degen(anchors[0]));
  let entry = firstOwn + 1;
  for (let s = 0; s < n - 1; s++) {
    let interior = 0;
    while (entry + interior < m2 && ownIdx[entry + interior] === -1) interior++;
    const cmd = body[s + 1];
    if (!interior) {
      out.push(cmd.slice());
    } else {
      const totalParts = interior + 1;
      let start = anchors[s];
      let rest = cmd;
      for (let q = 0; q < interior; q++) {
        const t = 1 / (totalParts - q);
        const sp = segType === "C" ? splitCubic(start, rest, t) : splitLine(start, rest, t);
        out.push(sp.first);
        start = sp.mid;
        rest = sp.second;
      }
      out.push(rest);
    }
    entry += interior + 1;
  }
  while (entry < m2) {
    out.push(degen(anchors[n - 1]));
    entry++;
  }
  if (closing) closing.forEach((c) => out.push(c.slice()));
  return out;
}
function reconcilePathPair(fromD, toD, entries, oldN, newN, isArea) {
  const fromAnalysis = analyzeSeriesPath(fromD, oldN, isArea);
  if (!fromAnalysis) return null;
  const toAnalysis = analyzeSeriesPath(toD, newN, isArea);
  if (!toAnalysis) return null;
  if (fromAnalysis.segType !== toAnalysis.segType) return null;
  if ((fromAnalysis.closing || toAnalysis.closing) && (!fromAnalysis.closing || !toAnalysis.closing || fromAnalysis.closing[0][0] !== toAnalysis.closing[0][0])) {
    return null;
  }
  const fromOwn = entries.map((e) => e.oldJ);
  const toOwn = entries.map((e) => e.newJ);
  return {
    from: arrayToPath(expandPath(fromAnalysis, fromOwn)),
    toInterp: arrayToPath(expandPath(toAnalysis, toOwn))
  };
}
function lengthTransitionEnabled(w2) {
  var _a;
  const anim = w2.config.chart.animations;
  if (!anim || anim.enabled === false) return false;
  if (!anim.dynamicAnimation || anim.dynamicAnimation.enabled === false) {
    return false;
  }
  const largeThreshold = (_a = anim.largeDatasetThreshold) != null ? _a : 0;
  if (largeThreshold > 0 && w2.globals.dataPoints > largeThreshold) return false;
  return !!(Environment.isBrowser() && w2.globals.dataChanged && w2.globals.shouldAnimate);
}
function datumKey(w2, realIndex, j) {
  var _a, _b, _c, _d;
  if ((_a = w2.axisFlags) == null ? void 0 : _a.isXNumeric) {
    const sx = (_c = (_b = w2.seriesData) == null ? void 0 : _b.seriesX) == null ? void 0 : _c[realIndex];
    if (sx && sx.length && sx[j] != null) return "x:" + sx[j];
  }
  const lbl = (_d = w2.globals.labels) == null ? void 0 : _d[j];
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
function seriesJoin(w2, realIndex, includeIdentity = false, allowReorder = false) {
  var _a, _b;
  if (!lengthTransitionEnabled(w2)) return null;
  const frame = w2.globals.prevStreamFrame;
  if (!frame) return null;
  const oldY = (_a = frame.seriesY) == null ? void 0 : _a[realIndex];
  const newY = (_b = w2.seriesData.series) == null ? void 0 : _b[realIndex];
  if (!Array.isArray(oldY) || !Array.isArray(newY)) return null;
  if (!oldY.length || !newY.length) return null;
  const oldKeys = uniquifyKeys(
    oldY.map((_, j) => frameDatumKey(frame, realIndex, j))
  );
  const newKeys = uniquifyKeys(newY.map((_, j) => datumKey(w2, realIndex, j)));
  const join = joinKeys(oldKeys, newKeys);
  if (!join.ordered && !allowReorder) return null;
  if (!join.changed && !includeIdentity) return null;
  return { join, oldKeys, newKeys };
}
function morphEasing(w2) {
  var _a, _b;
  const anim = w2.config.chart.animations;
  return resolveEasing((_b = (_a = anim.dynamicAnimation) == null ? void 0 : _a.easing) != null ? _b : anim.easing);
}
function rafTween(w2, duration, ease, onFrame, onDone) {
  const startAt = performance.now();
  const step = (now) => {
    if (w2.globals.isDestroyed) return;
    const raw = Math.max(0, Math.min(1, (now - startAt) / duration));
    onFrame(ease(raw), raw);
    if (raw < 1) {
      BrowserAPIs.requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  };
  BrowserAPIs.requestAnimationFrame(step);
}
function tweenSeriesMarkers(w2, { elPointsMain, realIndex, speed }) {
  var _a, _b, _c, _d;
  if (!(elPointsMain == null ? void 0 : elPointsMain.node)) return false;
  const sj = seriesJoin(w2, realIndex, true);
  if (!sj) return false;
  const frame = w2.globals.prevStreamFrame;
  if (!frame) return false;
  const oldXP = (_a = frame.xPixels) == null ? void 0 : _a[realIndex];
  const oldYP = (_b = frame.yPixels) == null ? void 0 : _b[realIndex];
  if (!oldXP || !oldYP) return false;
  const markers = elPointsMain.node.querySelectorAll(".apexcharts-marker");
  if (!markers.length) return false;
  const newXP = ((_c = w2.globals.seriesXvalues) == null ? void 0 : _c[realIndex]) || [];
  const newYP = ((_d = w2.globals.seriesYvalues) == null ? void 0 : _d[realIndex]) || [];
  const ease = morphEasing(w2);
  const duration = Math.max(1, speed || 1);
  elPointsMain.node.classList.remove("apexcharts-element-hidden");
  markers.forEach((node) => {
    var _a2, _b2, _c2, _d2, _e, _f, _g, _h, _i;
    const j = parseInt(
      (_b2 = (_a2 = node.getAttribute("j")) != null ? _a2 : node.getAttribute("rel")) != null ? _b2 : "",
      10
    );
    if (!isFinite(j) || j < 0 || j >= sj.join.toOld.length) return;
    const oldJ = sj.join.toOld[j];
    const to = newXP[j] != null && newYP[j] != null ? [newXP[j], newYP[j]] : null;
    if (oldJ === -1 || !to) {
      const style = (
        /** @type {any} */
        node.style
      );
      style.opacity = "0";
      rafTween(
        w2,
        duration,
        ease,
        (eased) => {
          style.opacity = String(eased);
        },
        () => {
          style.opacity = "";
        }
      );
      return;
    }
    const dx = ((_c2 = oldXP[oldJ]) != null ? _c2 : NaN) - to[0];
    const dy = ((_d2 = oldYP[oldJ]) != null ? _d2 : NaN) - to[1];
    if (!isFinite(dx) || !isFinite(dy)) return;
    const rFrom = (_g = (_f = (_e = frame.rPixels) == null ? void 0 : _e[realIndex]) == null ? void 0 : _f[oldJ]) != null ? _g : NaN;
    const rTo = parseFloat(
      (_i = (_h = node.getAttribute("r")) != null ? _h : node.getAttribute("default-marker-size")) != null ? _i : ""
    );
    const scales = isFinite(rFrom) && isFinite(rTo) && rTo > 0 && Math.abs(rFrom - rTo) > 0.25;
    const moves = Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5;
    if (!moves && !scales) return;
    const apply = (eased) => {
      const offX = dx * (1 - eased);
      const offY = dy * (1 - eased);
      if (scales) {
        const s = (rFrom + (rTo - rFrom) * eased) / rTo;
        node.setAttribute(
          "transform",
          `translate(${offX + to[0] * (1 - s)}, ${offY + to[1] * (1 - s)}) scale(${s})`
        );
      } else {
        node.setAttribute("transform", `translate(${offX}, ${offY})`);
      }
    };
    apply(0);
    rafTween(w2, duration, ease, apply, () => {
      node.removeAttribute("transform");
    });
  });
  return true;
}
function reconcileSeriesPaths(w2, { type, realIndex, pathFromLine, pathFromArea, linePaths, areaPaths }) {
  var _a, _b;
  const sj = seriesJoin(w2, realIndex);
  if (!sj) return null;
  const { join, oldKeys, newKeys } = sj;
  const frame = w2.globals.prevStreamFrame;
  if (!frame) return null;
  const oldY = (_a = frame.seriesY) == null ? void 0 : _a[realIndex];
  const newY = (_b = w2.seriesData.series) == null ? void 0 : _b[realIndex];
  if (oldY.length < 2 || newY.length < 2) return null;
  if (oldY.some((v2) => v2 === null) || newY.some((v2) => v2 === null)) return null;
  const entries = buildUnionEntries(join, oldKeys.length);
  const out = {};
  if (Array.isArray(linePaths) && linePaths.length === 1 && pathFromLine) {
    out.line = reconcilePathPair(
      pathFromLine,
      linePaths[0],
      entries,
      oldKeys.length,
      newKeys.length,
      false
    );
  }
  if (type === "area" && Array.isArray(areaPaths) && areaPaths.length === 1 && pathFromArea) {
    out.area = reconcilePathPair(
      pathFromArea,
      areaPaths[0],
      entries,
      oldKeys.length,
      newKeys.length,
      true
    );
  }
  if (!out.line && !out.area) return null;
  return out;
}
function firstMove(d) {
  const m2 = /^M\s*([+-]?[\d.eE]+)[\s,]+([+-]?[\d.eE]+)/.exec(d || "");
  if (!m2) return null;
  const x = parseFloat(m2[1]);
  const y = parseFloat(m2[2]);
  return isFinite(x) && isFinite(y) ? { x, y } : null;
}
function renderBarExitGhosts({
  w: w2,
  elSeries,
  record,
  newKeys,
  isHorizontal,
  speed
}) {
  var _a;
  if (!lengthTransitionEnabled(w2)) return;
  if (!record || !Array.isArray(record.paths) || !(elSeries == null ? void 0 : elSeries.node)) return;
  const newKeySet = new Set(newKeys);
  const exits = record.paths.filter(
    (p2) => p2 && p2.d && p2.key != null && !newKeySet.has(p2.key)
  );
  if (!exits.length) return;
  const graphics = new Graphics(w2);
  const fallbackFill = (_a = w2.globals.colors) == null ? void 0 : _a[parseInt(String(record.realIndex), 10)];
  exits.forEach((p2) => {
    let fill = p2.fill || fallbackFill || "#c8c8c8";
    if (String(fill).indexOf("url(") === 0) fill = fallbackFill || "#c8c8c8";
    const ghost = graphics.drawPath({
      d: p2.d,
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
      `url(#gridRectBarMask${w2.globals.cuid})`
    );
    elSeries.node.insertBefore(node, elSeries.node.firstChild);
    const start = firstMove(p2.d);
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
      if (w2.globals.isDestroyed || !node.parentNode) return;
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
    const w2 = this.w;
    const graphics = new Graphics(this.barCtx.w);
    const strokeWidth = Array.isArray(this.barCtx.strokeWidth) ? this.barCtx.strokeWidth[realIndex] : this.barCtx.strokeWidth;
    let bcx;
    let bcy;
    if (w2.axisFlags.isXNumeric && !w2.globals.isBarHorizontal) {
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
    const dataLabelsConfig = w2.config.dataLabels;
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
      w2,
      realIndex,
      j
    );
    const offY = resolveDataLabelOffset(
      dataLabelsConfig.offsetY,
      w2,
      realIndex,
      j
    );
    let textRects = {
      width: 0,
      height: 0
    };
    if (w2.config.dataLabels.enabled) {
      const yLabel = w2.seriesData.series[realIndex][j];
      textRects = graphics.getTextRects(
        w2.config.dataLabels.formatter ? w2.config.dataLabels.formatter(yLabel, __spreadProps(__spreadValues({}, w2), {
          seriesIndex: realIndex,
          dataPointIndex: j,
          w: w2
        })) : w2.formatters.yLabelFormatters[0](yLabel),
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
    dataLabels = this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      val: this.barCtx.isRangeBar ? [y1, y2] : w2.config.chart.stackType === "100%" ? series[realIndex][j] : w2.seriesData.series[realIndex][j],
      i: realIndex,
      j,
      barWidth,
      barHeight,
      textRects,
      dataLabelsConfig
    });
    if (w2.config.chart.stacked && barTotalDataLabelsConfig.enabled) {
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
    const w2 = this.w;
    const ctx = this.getTotalGroupContext(realIndex);
    const byGroups = w2.seriesData.stackedSeriesTotalsByGroups;
    return ctx && byGroups && byGroups[ctx.groupIndex] ? byGroups[ctx.groupIndex][j] : this.barCtx.stackedSeriesTotals[j];
  }
  /** @param {{realIndex: any, j: any}} opts */
  getStackedTotalDataLabel({ realIndex, j }) {
    const w2 = this.w;
    let val = this.getStackedTotalValue({ realIndex, j });
    if (this.totalFormatter) {
      val = this.totalFormatter(val, __spreadProps(__spreadValues({}, w2), {
        seriesIndex: realIndex,
        dataPointIndex: j,
        w: w2
      }));
    }
    return val;
  }
  /**
   * @param {Record<string, any>} opts
   */
  calculateColumnsDataLabelsPosition(opts) {
    const w2 = this.w;
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
    const vertical = w2.config.plotOptions.bar.dataLabels.orientation === "vertical";
    const { zeroEncounters } = this.barCtx.barHelpers.getZeroValueEncounters({
      i,
      j
    });
    bcx = bcx - strokeWidth / 2;
    const dataPointsDividedWidth = w2.layout.gridWidth / w2.globals.dataPoints;
    if (this.barCtx.isVerticalGroupedRangeBar) {
      dataLabelsX += barWidth / 2;
    } else {
      if (w2.axisFlags.isXNumeric) {
        dataLabelsX = bcx - barWidth / 2 + offX;
      } else {
        dataLabelsX = bcx - dataPointsDividedWidth + barWidth / 2 + offX;
      }
      if (!w2.config.chart.stacked && zeroEncounters > 0 && w2.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        dataLabelsX -= barWidth * zeroEncounters;
      }
    }
    if (vertical) {
      const offsetDLX = 2;
      dataLabelsX = dataLabelsX + textRects.height / 2 - strokeWidth / 2 - offsetDLX;
    }
    const valIsNegative = w2.seriesData.series[i][j] < 0;
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
    const prevYGroups = totalGroupCtx ? [totalGroupCtx.group] : w2.labelData.seriesGroups;
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
      totalDataLabelsX = totalDataLabelsBcx + (w2.axisFlags.isXNumeric ? -barWidth / 2 : barWidth / 2 - xDivision) + barTotalDataLabelsConfig.offsetX;
    }
    if (!w2.config.chart.stacked) {
      if (dataLabelsY < 0) {
        dataLabelsY = 0 + strokeWidth;
      } else if (dataLabelsY + textRects.height / 3 > w2.layout.gridHeight) {
        dataLabelsY = w2.layout.gridHeight - strokeWidth;
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
    const w2 = this.w;
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
    const dataPointsDividedHeight = w2.layout.gridHeight / w2.globals.dataPoints;
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
    if (!w2.config.chart.stacked && zeroEncounters > 0 && w2.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
      dataLabelsY -= barHeight * zeroEncounters;
    }
    let totalDataLabelsX;
    let totalDataLabelsY;
    let totalDataLabelsAnchor = "start";
    const valIsNegative = w2.seriesData.series[i][j] < 0;
    let newX = x;
    if (this.barCtx.isReversed) {
      newX = x + (valIsNegative ? -barWidth : barWidth);
      totalDataLabelsAnchor = valIsNegative ? "start" : "end";
    }
    if (this.barCtx.isPyramid) {
      dataLabelsX = w2.layout.gridWidth / 2 + offX;
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
    const prevXGroups = totalGroupCtx ? [totalGroupCtx.group] : w2.labelData.seriesGroups;
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
      if (w2.globals.barGroups.length > 1 && !totalGroupCtx) {
        totalDataLabelsY = totalDataLabelsY - w2.globals.barGroups.length / 2 * (barHeight / 2);
      }
    }
    if (!w2.config.chart.stacked) {
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
      if (dataLabelsX + spanRight > w2.layout.gridWidth - strokeWidth) {
        dataLabelsX = w2.layout.gridWidth - spanRight - strokeWidth;
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
    const w2 = this.w;
    let rotate = "rotate(0)";
    if (w2.config.plotOptions.bar.dataLabels.orientation === "vertical")
      rotate = `rotate(-90, ${x}, ${y})`;
    const dataLabels = new DataLabels(this.barCtx.w, this.barCtx.ctx);
    const graphics = new Graphics(this.barCtx.w);
    const formatter = dataLabelsConfig.formatter;
    let elDataLabelsWrap = null;
    const isSeriesCollapsed = w2.globals.collapsedSeriesIndices.indexOf(i) > -1;
    const isSeriesCollapsing = (w2.globals.collapsingSeriesIndices || []).indexOf(i) > -1;
    if (isSeriesCollapsing) {
      const prev = (_a = w2.globals.prevDataLabels) == null ? void 0 : _a.get(`${i}::${datumKey(w2, i, j)}`);
      if (prev && isFinite(prev.val)) val = prev.val;
    }
    if (dataLabelsConfig.enabled && (!isSeriesCollapsed || isSeriesCollapsing)) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels",
        transform: rotate
      });
      const dlCfg = w2.config.dataLabels;
      if (((_b = dlCfg.animate) == null ? void 0 : _b.enabled) || ((_c = dlCfg.countUp) == null ? void 0 : _c.enabled)) {
        elDataLabelsWrap.node.setAttribute(
          "data:dlKey",
          `${i}::${datumKey(w2, i, j)}`
        );
        elDataLabelsWrap.node.setAttribute("data:dlJ", String(j));
        if (typeof val === "number" && isFinite(val)) {
          elDataLabelsWrap.node.setAttribute("data:dlVal", String(val));
        }
      }
      let text = "";
      if (typeof val !== "undefined") {
        text = formatter(val, __spreadProps(__spreadValues({}, w2), {
          seriesIndex: i,
          dataPointIndex: j,
          w: w2
        }));
      }
      if (!val && w2.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        text = "";
      }
      const valIsNegative = w2.seriesData.series[i][j] < 0;
      const position = w2.config.plotOptions.bar.dataLabels.position;
      if (w2.config.plotOptions.bar.dataLabels.orientation === "vertical") {
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
      if (w2.config.chart.stacked && this.barCtx.barOptions.dataLabels.hideOverflowingLabels && // A collapsing series is measured against its NEW extent, which is
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
function isHistogramOverlay(w2) {
  var _a, _b, _c, _d, _e, _f, _g;
  if (((_b = (_a = w2 == null ? void 0 : w2.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.requestedType) !== "histogram") return false;
  if (((_d = (_c = w2.config.plotOptions) == null ? void 0 : _c.histogram) == null ? void 0 : _d.overlap) === false) return false;
  return ((_g = (_f = (_e = w2.seriesData) == null ? void 0 : _e.series) == null ? void 0 : _f.length) != null ? _g : 0) > 1;
}
let Helpers$1 = class Helpers3 {
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
    const w2 = this.w;
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
      if (w2.axisFlags.isXNumeric) {
        for (let j = 0; j < series[sl].length; j++) {
          if (w2.seriesData.seriesX[sl][j] > w2.globals.minX && w2.seriesData.seriesX[sl][j] < w2.globals.maxX) {
            this.barCtx.visibleItems++;
          }
        }
      } else {
        this.barCtx.visibleItems = w2.globals.dataPoints;
      }
    }
    this.arrBorderRadius = this.createBorderRadiusArr(w2.seriesData.series);
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
   * @param {number} realIndex
   */
  initialPositions(realIndex) {
    const w2 = this.w;
    let x, y, yDivision, xDivision, barHeight, barWidth, zeroH, zeroW;
    let dataPoints = w2.globals.dataPoints;
    if (this.barCtx.isRangeBar) {
      dataPoints = w2.labelData.labels.length;
    }
    let seriesLen = this.barCtx.seriesLen;
    if (w2.config.plotOptions.bar.rangeBarGroupRows || isHistogramOverlay(w2)) {
      seriesLen = 1;
    }
    if (this.barCtx.isHorizontal) {
      yDivision = w2.layout.gridHeight / dataPoints;
      barHeight = yDivision / seriesLen;
      if (w2.axisFlags.isXNumeric) {
        yDivision = w2.layout.gridHeight / this.barCtx.totalItems;
        barHeight = yDivision / this.barCtx.seriesLen;
      }
      barHeight = barHeight * parseInt(this.barCtx.barOptions.barHeight, 10) / 100;
      if (String(this.barCtx.barOptions.barHeight).indexOf("%") === -1) {
        barHeight = parseInt(this.barCtx.barOptions.barHeight, 10);
      }
      zeroW = this.barCtx.baseLineInvertedY + w2.globals.padHorizontal + (this.barCtx.isReversed ? w2.layout.gridWidth : 0) - (this.barCtx.isReversed ? this.barCtx.baseLineInvertedY * 2 : 0);
      if (this.barCtx.isFunnel) {
        zeroW = w2.layout.gridWidth / 2;
      }
      y = (yDivision - barHeight * this.barCtx.seriesLen) / 2;
    } else {
      xDivision = w2.layout.gridWidth / this.barCtx.visibleItems;
      if (w2.config.xaxis.convertedCatToNumeric) {
        xDivision = w2.layout.gridWidth / w2.globals.dataPoints;
      }
      barWidth = xDivision / seriesLen * parseInt(this.barCtx.barOptions.columnWidth, 10) / 100;
      if (w2.axisFlags.isXNumeric) {
        const xRatio = this.barCtx.xRatio;
        if (w2.globals.minXDiff && w2.globals.minXDiff !== 0.5 && w2.globals.minXDiff / xRatio > 0) {
          xDivision = w2.globals.minXDiff / xRatio;
        }
        barWidth = xDivision / seriesLen * parseInt(this.barCtx.barOptions.columnWidth, 10) / 100;
        if (barWidth < 1) {
          barWidth = 1;
        }
      }
      if (String(this.barCtx.barOptions.columnWidth).indexOf("%") === -1) {
        barWidth = parseInt(this.barCtx.barOptions.columnWidth, 10);
      }
      zeroH = w2.layout.gridHeight - this.barCtx.baseLineY[this.barCtx.translationsIndex] - (this.barCtx.isReversed ? w2.layout.gridHeight : 0) + (this.barCtx.isReversed ? this.barCtx.baseLineY[this.barCtx.translationsIndex] * 2 : 0);
      if (w2.axisFlags.isXNumeric) {
        const xForNumericX = this.barCtx.getBarXForNumericXAxis({
          x,
          j: 0,
          realIndex,
          barWidth
        });
        x = xForNumericX.x;
      } else {
        x = w2.globals.padHorizontal + Utils.noExponents(xDivision - barWidth * this.barCtx.seriesLen) / 2;
      }
    }
    w2.globals.barHeight = barHeight;
    w2.globals.barWidth = barWidth;
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
    const w2 = ctx.w;
    w2.labelData.seriesGroups.forEach((group) => {
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
    const w2 = ctx.w;
    w2.labelData.seriesGroups.forEach((group) => {
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
    const w2 = this.w;
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
      fillConfig: (_a = w2.config.series[i].data[j]) == null ? void 0 : _a.fill,
      fillType: ((_c = (_b = w2.config.series[i].data[j]) == null ? void 0 : _b.fill) == null ? void 0 : _c.type) ? (_d = w2.config.series[i].data[j]) == null ? void 0 : _d.fill.type : Array.isArray(w2.config.fill.type) ? w2.config.fill.type[realIndex] : w2.config.fill.type
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
    const w2 = this.w;
    if (typeof this.barCtx.series[i][j] === "undefined" || this.barCtx.series[i][j] === null || w2.config.chart.type === "bar" && !this.barCtx.series[i][j]) {
      this.barCtx.isNullValue = true;
    } else {
      this.barCtx.isNullValue = false;
    }
    if (w2.config.stroke.show) {
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
      const g2 = this.getSeriesGroupIndex(i);
      if (g2 > -1) buckets[g2].push(i);
      else ungrouped.push(i);
    }
    if (ungrouped.length) buckets.push(ungrouped);
    return buckets.filter((b2) => b2.length > 0);
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
    const w2 = this.w;
    const alwaysApplyRadius = !this.w.config.chart.stacked || w2.config.plotOptions.bar.borderRadius <= 0;
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
    const w2 = this.w;
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
        typeof x2 !== "undefined" ? x2 : w2.layout.gridWidth,
        typeof y2 !== "undefined" ? y2 : w2.layout.gridHeight,
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
    w: w2
  }) {
    var _a, _b, _c;
    const graphics = new Graphics(this.barCtx.w);
    strokeWidth = Array.isArray(strokeWidth) ? strokeWidth[realIndex] : strokeWidth;
    if (!strokeWidth) strokeWidth = 0;
    let bW = barWidth;
    let bXP = barXPosition;
    if ((_a = w2.config.series[realIndex].data[j]) == null ? void 0 : _a.columnWidthOffset) {
      bXP = barXPosition - w2.config.series[realIndex].data[j].columnWidthOffset / 2;
      bW = barWidth + w2.config.series[realIndex].data[j].columnWidthOffset;
    }
    const strokeCenter = strokeWidth / 2;
    const x1 = bXP + strokeCenter;
    const x2 = bXP + bW - strokeCenter;
    const direction = (series[i][j] >= 0 ? 1 : -1) * (isReversed ? -1 : 1);
    y1 += 1e-3 - strokeCenter * direction;
    y2 += 1e-3 + strokeCenter * direction;
    const sl = graphics.line(x2, y1);
    const closing = w2.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z";
    const squarePathTo = graphics.move(x1, y1) + graphics.line(x1, y2) + graphics.line(x2, y2) + sl + closing;
    let pathTo = squarePathTo;
    if (this.arrBorderRadius[realIndex][j] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w2.config.plotOptions.bar.borderRadius
      );
    }
    let pathFrom = null;
    const morphFrom = (_c = (_b = this.barCtx.ctx) == null ? void 0 : _b.morphTypeChange) == null ? void 0 : _c.getInitialPathFor(
      realIndex,
      j
    );
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w2.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo, squarePathTo);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(x1, y1) + graphics.line(x1, y1) + sl + sl + sl + sl + sl + graphics.line(x1, y1) + closing;
    }
    if (w2.config.chart.stacked) {
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
    w: w2
  }) {
    var _a, _b;
    const graphics = new Graphics(this.barCtx.w);
    const center = w2.layout.gridWidth / 2;
    const halfWidthFor = (v2) => Math.abs(v2 / this.barCtx.invertedYRatio) / 2;
    const topHalf = halfWidthFor(series[i][j]);
    const lastIdx = series[i].length - 1;
    const isLast = j === lastIdx;
    const lastShape = w2.config.plotOptions.funnel.lastShape === "taper" ? "taper" : "flat";
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
    } else if (w2.globals.previousPaths.length > 0) {
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
    const w2 = this.w;
    const gridHeight = w2.layout.gridHeight;
    const gridWidth = w2.layout.gridWidth;
    const values = seriesData.map(
      /** @param {any} v */
      (v2) => Math.abs(Number(v2) || 0)
    );
    const total = values.reduce(
      /** @param {number} a @param {number} b */
      (a, b2) => a + b2,
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
    w: w2
  }) {
    var _a, _b;
    const graphics = new Graphics(this.barCtx.w);
    const center = w2.layout.gridWidth / 2;
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
    } else if (w2.globals.previousPaths.length > 0) {
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
    w: w2
  }) {
    var _a, _b, _c;
    const graphics = new Graphics(this.barCtx.w);
    strokeWidth = Array.isArray(strokeWidth) ? strokeWidth[realIndex] : strokeWidth;
    if (!strokeWidth) strokeWidth = 0;
    let bYP = barYPosition;
    let bH = barHeight;
    if ((_a = w2.config.series[realIndex].data[j]) == null ? void 0 : _a.barHeightOffset) {
      bYP = barYPosition - w2.config.series[realIndex].data[j].barHeightOffset / 2;
      bH = barHeight + w2.config.series[realIndex].data[j].barHeightOffset;
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
    const closing = w2.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z";
    const squarePathTo = graphics.move(x1, y1) + graphics.line(x2, y1) + graphics.line(x2, y2) + sl + closing;
    let pathTo = squarePathTo;
    if (this.arrBorderRadius[realIndex][j] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w2.config.plotOptions.bar.borderRadius
      );
    }
    let pathFrom = null;
    const morphFrom = (_c = (_b = this.barCtx.ctx) == null ? void 0 : _b.morphTypeChange) == null ? void 0 : _c.getInitialPathFor(
      realIndex,
      j
    );
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w2.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo, squarePathTo);
    }
    if (pathFrom == null) {
      const slFrom = isFunnel ? graphics.line(fromX, y2) : sl;
      pathFrom = graphics.move(fromX, y1) + graphics.line(fromX, y1) + slFrom + slFrom + slFrom + slFrom + slFrom + graphics.line(fromX, y1) + closing;
    }
    if (w2.config.chart.stacked) {
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
    const w2 = this.w;
    const goals = [];
    const pushGoal = (value, attrs) => {
      goals.push({
        [type]: type === "x" ? this.getXForValue(value, zeroW, false) : this.getYForValue(value, zeroH, translationsIndex, false),
        attrs
      });
    };
    if (w2.seriesData.seriesGoals[i] && w2.seriesData.seriesGoals[i][j] && Array.isArray(w2.seriesData.seriesGoals[i][j])) {
      w2.seriesData.seriesGoals[i][j].forEach((goal) => {
        pushGoal(goal.value, goal);
      });
    }
    if (this.barCtx.barOptions.isDumbbell && w2.rangeData.seriesRange.length) {
      const colors = this.barCtx.barOptions.dumbbellColors ? this.barCtx.barOptions.dumbbellColors : w2.globals.colors;
      const commonAttrs = {
        strokeHeight: type === "x" ? 0 : w2.globals.markers.size[i],
        strokeWidth: type === "x" ? w2.globals.markers.size[i] : 0,
        strokeDashArray: 0,
        strokeLineCap: "round",
        strokeColor: Array.isArray(colors[i]) ? colors[i][0] : colors[i]
      };
      pushGoal(w2.rangeData.seriesRangeStart[i][j], commonAttrs);
      pushGoal(w2.rangeData.seriesRangeEnd[i][j], __spreadProps(__spreadValues({}, commonAttrs), {
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
    const w2 = this.w;
    const { x: prevX2, x1: prevX1, barYPosition: prevY1 } = prevPaths;
    const { x: currX2, x1: currX1, barYPosition: currY1 } = currPaths;
    const prevY2 = prevY1 + currPaths.barHeight;
    const graphics = new Graphics(this.barCtx.w);
    const utils = new Utils();
    const shadowPath = graphics.move(prevX1, prevY2) + graphics.line(prevX2, prevY2) + graphics.line(currX2, currY1) + graphics.line(currX1, currY1) + graphics.line(prevX1, prevY2) + (w2.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z");
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
    const w2 = this.w;
    let nonZeroColumns = 0;
    let zeroEncounters = 0;
    const seriesIndices = w2.config.plotOptions.bar.horizontal ? w2.seriesData.series.map((_, _i) => _i) : ((_a = w2.globals.columnSeries) == null ? void 0 : _a.i.map((_i) => _i)) || [];
    seriesIndices.forEach((_si) => {
      const val = w2.globals.seriesPercent[_si][j];
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
    const w2 = this.w;
    return w2.labelData.seriesGroups.findIndex(
      (group) => group.indexOf(w2.seriesData.seriesNames[seriesIndex]) > -1
    );
  }
  /**
   * @param {number} seriesIndex
   */
  getGroupIndex(seriesIndex) {
    const w2 = this.w;
    const groupIndex = w2.labelData.seriesGroups.findIndex(
      (group) => (
        // w.config.series[i].name may be undefined, so use
        // w.seriesData.seriesNames[i], which has default names for those
        // series. w.labelData.seriesGroups[] uses the same default naming.
        group.indexOf(w2.seriesData.seriesNames[seriesIndex]) > -1
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
};
class Bar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  constructor(w2, ctx, xyRatios) {
    this.ctx = ctx;
    this.w = w2;
    this.barOptions = w2.config.plotOptions.bar;
    this.isHorizontal = this.barOptions.horizontal;
    this.strokeWidth = w2.config.stroke.width;
    this.isNullValue = false;
    this.isRangeBar = w2.rangeData.seriesRange.length && this.isHorizontal;
    this.isVerticalGroupedRangeBar = !w2.globals.isBarHorizontal && w2.rangeData.seriesRange.length && w2.config.plotOptions.bar.rangeBarGroupRows;
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
    this.barHelpers = new Helpers$1(this);
  }
  /** primary draw method which is called on bar object
   * @memberof Bar
   * @param {any[]} series - user supplied series values
   * @param {number} seriesIndex - the index by which series will be drawn on the svg
   * @return {Element} element which is supplied to parent chart draw method for appending
   **/
  draw(series, seriesIndex) {
    var _a, _b, _c;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const coreUtils = new CoreUtils(this.w);
    series = coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    if (w2.config.dataLabels.enabled) {
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
      const realIndex = w2.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      const elSeries = graphics.group({
        class: `apexcharts-series`,
        rel: i + 1,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[realIndex]),
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex);
      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1;
      }
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w2.globals.seriesYAxisReverseMap[realIndex];
        this.translationsIndex = realIndex;
      }
      const translationsIndex = this.translationsIndex;
      this.isReversed = w2.config.yaxis[this.yaxisIndex] && w2.config.yaxis[this.yaxisIndex].reversed;
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
      w2.globals.delayedElements.push({
        el: elDataLabelsWrap.node,
        // On a layout-changing update the labels must stay hidden through the
        // reflow morph (the updateOptions flow otherwise reveals them at
        // frame 0, where they float over sliding bars). When dataLabels.animate
        // is on the labels instead RIDE the morph (see DataLabelTransition), so
        // keep them visible: holding would hide the very motion we want to show.
        holdUntilComplete: !((_a = w2.config.dataLabels.animate) == null ? void 0 : _a.enabled) && this.isLengthTransition(realIndex)
      });
      elDataLabelsWrap.node.classList.add("apexcharts-element-hidden");
      const elGoalsMarkers = graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      const elBarShadows = graphics.group({
        class: "apexcharts-bar-shadows"
      });
      w2.globals.delayedElements.push({
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
        if (this.isFunnel && !this.isPyramid && this.barOptions.isFunnel3d && ((_b = w2.config.plotOptions.funnel) == null ? void 0 : _b.shape) !== "trapezoid" && this.pathArr.length && j > 0) {
          const barShadow = this.barHelpers.drawBarShadow({
            color: typeof pathFill.color === "string" && ((_c = pathFill.color) == null ? void 0 : _c.indexOf("url")) === -1 ? pathFill.color : Utils.hexToRgba(w2.globals.colors[i]),
            prevPaths: this.pathArr[this.pathArr.length - 1],
            currPaths: paths,
            realIndex,
            j
          });
          elBarShadows.add(barShadow);
          if (w2.config.chart.dropShadow.enabled) {
            const filters = new Filters(this.w);
            filters.dropShadow(barShadow, w2.config.chart.dropShadow, realIndex);
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
      w2.globals.seriesXvalues[realIndex] = xArrj;
      w2.globals.seriesYvalues[realIndex] = yArrj;
      if (w2.globals.previousPaths.length > 0) {
        const newKeys = [];
        for (let j = 0; j < series[i].length; j++) {
          newKeys.push(datumKey(w2, realIndex, j));
        }
        renderBarExitGhosts({
          w: w2,
          elSeries,
          record: this._prevRecord(realIndex),
          newKeys,
          isHorizontal: this.isHorizontal,
          speed: w2.config.chart.animations.dynamicAnimation.speed
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
    const w2 = this.w;
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
        const exp = w2.config.stroke.colors;
        let c;
        if (Array.isArray(exp) && exp.length > 0) {
          c = exp[i2];
          if (!c) c = "";
          if (typeof c === "function") {
            return c({
              value: w2.seriesData.series[i2][j],
              dataPointIndex: j,
              w: w2
            });
          }
        }
        return c;
      };
      const checkAvailableColor = typeof w2.globals.stroke.colors[realIndex] === "function" ? fetchColor(realIndex) : w2.globals.stroke.colors[realIndex];
      lineFill = this.barOptions.distributed ? w2.globals.stroke.colors[j] : checkAvailableColor;
    }
    const animCfg = w2.config.chart.animations;
    const gradCfg = animCfg.animateGradually;
    const staggerEnabled = gradCfg && gradCfg.enabled !== false && !(w2.globals.dataChanged && this.isLayoutShift(realIndex));
    let delay = 0;
    let delayMs = 0;
    if (staggerEnabled) {
      const totalBars = w2.globals.dataPoints || 1;
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
      if (w2.config.chart.stacked && !w2.globals.dataChanged) {
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
      const dlAnimCfg = w2.config.dataLabels;
      if (((_a = dlAnimCfg.animate) == null ? void 0 : _a.enabled) || ((_b = dlAnimCfg.countUp) == null ? void 0 : _b.enabled)) {
        const stampDelay = String(Math.round(delayMs));
        (_d = (_c = dataLabelsObj.dataLabels) == null ? void 0 : _c.node) == null ? void 0 : _d.setAttribute("data:dlDelay", stampDelay);
        (_f = (_e = dataLabelsObj.totalDataLabels) == null ? void 0 : _e.node) == null ? void 0 : _f.setAttribute(
          "data:dlDelay",
          stampDelay
        );
      }
    }
    if (!w2.globals.isBarHorizontal) {
      if (dataLabelsObj.dataLabelsPos.dataLabelsX + Math.max(barWidth, w2.globals.barPadForNumericAxis) < 0 || dataLabelsObj.dataLabelsPos.dataLabelsX - Math.max(barWidth, w2.globals.barPadForNumericAxis) > w2.layout.gridWidth) {
        skipDrawing = true;
      }
    }
    if (
      /** @type {Record<string,any>} */
      w2.config.series[i].data[j] && /** @type {Record<string,any>} */
      w2.config.series[i].data[j].strokeColor
    ) {
      lineFill = /** @type {Record<string,any>} */
      w2.config.series[i].data[j].strokeColor;
    }
    if (this.isNullValue && w2.globals.collapsingSeriesIndices.indexOf(realIndex) === -1) {
      pathFill = "none";
    }
    if (!skipDrawing) {
      const morphActive = ((_g = this.ctx.morphTypeChange) == null ? void 0 : _g.isActive()) === true;
      const dataChangeSpeed = morphActive ? this.ctx.morphTypeChange.getSpeed() : w2.config.chart.animations.dynamicAnimation.speed;
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
          strokeLineCap: w2.config.stroke.lineCap,
          fill: pathFill,
          pathToInterp,
          animationDelay: delay,
          initialSpeed: w2.config.chart.animations.speed,
          dataChangeSpeed,
          // `classes` is optional: boxPlot, violin and candlestick call
          // renderSeries without it, and interpolating it unguarded stamped a
          // literal "undefined" into every one of their marks' class lists.
          className: `apexcharts-${type}-area${classes ? ` ${classes}` : ""}`,
          chartType: type,
          bindEventsOnPaths: false
        })
      );
      renderedPath.attr("clip-path", `url(#gridRectBarMask${w2.globals.cuid})`);
      if (pieceClaimed) {
        renderedPath.node.setAttribute("opacity", "0");
        renderedPath.node.setAttribute("data-piece-hidden", "1");
      }
      const forecast = w2.config.forecastDataPoints;
      if (forecast.count > 0) {
        if (j >= w2.globals.dataPoints - forecast.count) {
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
        val: w2.seriesData.series[i][j],
        barHeight,
        barWidth,
        // Datum identity for the next update's keyed join (see
        // LengthTransition): survivors match by key, not array position.
        "data:pathKey": datumKey(w2, realIndex, j)
      });
      if (emit.kind === "canvas") {
        if (!w2.globals.barCanvasCoords) w2.globals.barCanvasCoords = {};
        if (!w2.globals.barCanvasCoords[realIndex]) {
          w2.globals.barCanvasCoords[realIndex] = {};
        }
        w2.globals.barCanvasCoords[realIndex][j] = {
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
    const w2 = this.w;
    const i = indexes.i;
    const j = indexes.j;
    let barYPosition;
    if (w2.axisFlags.isXNumeric) {
      y = (w2.seriesData.seriesX[i][j] - w2.globals.minX) / this.invertedXRatio - barHeight;
      barYPosition = y + barHeight * this.visibleI;
    } else {
      if (w2.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
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
    const useTrapezoid = this.isFunnel && w2.config.plotOptions.funnel.shape === "trapezoid";
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
        w: w2
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
        w: w2
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
        w: w2
      });
    }
    if (useTrapezoid || usePyramid) {
      zeroW = paths.x1;
      x = paths.x;
    }
    if (!w2.axisFlags.isXNumeric && !usePyramid) {
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
    const w2 = this.w;
    const realIndex = indexes.realIndex;
    const translationsIndex = indexes.translationsIndex;
    const i = indexes.i;
    const j = indexes.j;
    const bc = indexes.bc;
    let barXPosition;
    if (w2.axisFlags.isXNumeric) {
      const xForNumericX = this.getBarXForNumericXAxis({
        x,
        j,
        realIndex,
        barWidth
      });
      x = xForNumericX.x;
      barXPosition = xForNumericX.barXPosition;
    } else {
      if (w2.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
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
        w: w2
      })
    );
    if (!w2.axisFlags.isXNumeric) {
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
    const w2 = this.w;
    let sxI = realIndex;
    if (!w2.seriesData.seriesX[realIndex].length) {
      sxI = w2.globals.maxValsInArrayIndex;
    }
    if (Utils.isNumber(w2.seriesData.seriesX[sxI][j])) {
      x = AxisMapping.dataXToPx(w2, w2.seriesData.seriesX[sxI][j]) - barWidth * this.seriesLen / 2;
    }
    return {
      barXPosition: x + (isHistogramOverlay(w2) ? 0 : barWidth * this.visibleI),
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
    const w2 = this.w;
    let record = null;
    for (let pp = 0; pp < w2.globals.previousPaths.length; pp++) {
      const gpp = w2.globals.previousPaths[pp];
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
    if (record && record.paths.every((p2) => p2.key != null)) {
      const keyed = /* @__PURE__ */ new Map();
      record.paths.forEach((p2) => {
        keyed.set(p2.key, p2);
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
    const w2 = this.w;
    let result = false;
    if (lengthTransitionEnabled(w2) && w2.globals.previousPaths.length > 0) {
      const record = this._prevRecord(realIndex);
      const dataLen = (_b = (_a = w2.seriesData.series[realIndex]) == null ? void 0 : _a.length) != null ? _b : 0;
      if (!record) {
        result = dataLen > 0;
      } else if (record.paths.length !== dataLen) {
        result = true;
      } else {
        const keyed = this._prevKeyedPaths(realIndex);
        if (keyed) {
          for (let j = 0; j < dataLen; j++) {
            if (!keyed.has(datumKey(w2, realIndex, j))) {
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
    const w2 = this.w;
    this._pathToInterp = null;
    const record = this._prevRecord(realIndex);
    if (!record) {
      return lengthTransitionEnabled(w2) ? null : pathTo;
    }
    let oldD = null;
    let isNewDatum = false;
    const keyed = this._prevKeyedPaths(realIndex);
    if (keyed) {
      const prev = keyed.get(datumKey(w2, realIndex, j));
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
      const graphics = new Graphics(w2);
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
    if (isNewDatum && lengthTransitionEnabled(w2)) {
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
    let m2;
    while ((m2 = re.exec(d)) !== null) {
      const nums = m2[2].trim().split(/[\s,]+/).map(Number);
      if (nums.length < 2 || nums.some(isNaN)) continue;
      pts.push([nums[nums.length - 2], nums[nums.length - 1]]);
    }
    if (pts.length < 3) return null;
    const xs = pts.map((p2) => p2[0]);
    const ys = pts.map((p2) => p2[1]);
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
    const near = (v2, a, b2) => Math.abs(v2 - a) <= Math.abs(v2 - b2) ? [a, b2] : [b2, a];
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
    const w2 = this.w;
    const record = this._prevRecord(realIndex);
    if (!record) return null;
    const keyed = this._prevKeyedPaths(realIndex);
    const prev = keyed ? keyed.get(datumKey(w2, realIndex, j)) : record.paths[j];
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
    const w2 = this.w;
    this.graphics = new Graphics(this.w);
    this.bar = new Bar(this.w, this.ctx, this.xyRatios);
    const coreUtils = new CoreUtils(this.w);
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    if (w2.config.chart.stackType === "100%") {
      series = w2.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex.map(
          (_) => w2.globals.seriesPercent[_]
        )
      ) : w2.globals.seriesPercent.slice();
    }
    this.series = series;
    this.barHelpers.initializeStackedPrevVars(this);
    const ret = this.graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    let x = 0;
    let y = 0;
    const anim = w2.config.chart.animations;
    const holdMirror = anim.enabled && anim.dynamicAnimation.enabled && w2.globals.previousPaths.length > 0;
    let heldMirrors = false;
    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      const realIndex = w2.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { groupIndex, columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      this.groupCtx = /** @type {any} */
      this[
        /** @type {any} */
        w2.labelData.seriesGroups[groupIndex]
      ];
      const xArrValues = [];
      const yArrValues = [];
      let translationsIndex = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = /** @type {any} */
        w2.globals.seriesYAxisReverseMap[realIndex][0];
        translationsIndex = realIndex;
      }
      this.isReversed = w2.config.yaxis[this.yaxisIndex] && w2.config.yaxis[this.yaxisIndex].reversed;
      let elSeries = this.graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[realIndex]),
        rel: i + 1,
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex);
      const elDataLabelsWrap = this.graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elDataLabelsWrap, realIndex);
      if ((w2.globals.collapsingSeriesIndices || []).indexOf(realIndex) > -1) {
        elDataLabelsWrap.node.style.setProperty(
          "--apexcharts-dl-exit",
          `${w2.config.chart.animations.dynamicAnimation.speed}ms`
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
      w2.globals.barHeight = barHeight;
      w2.globals.barWidth = barWidth;
      this.barHelpers.initializeStackedXYVars(this);
      if (this.groupCtx.prevY.length === 1 && /**
       * @param {number} val
       */
      this.groupCtx.prevY[0].every((val) => isNaN(val))) {
        this.groupCtx.prevY[0] = this.groupCtx.prevY[0].map(() => zeroH);
        this.groupCtx.prevYF[0] = this.groupCtx.prevYF[0].map(() => 0);
      }
      for (let j = 0; j < w2.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        const commonPathOpts = {
          indexes: { i, j, realIndex, translationsIndex, bc },
          strokeWidth,
          x,
          y,
          elSeries,
          columnGroupIndex,
          seriesGroup: w2.labelData.seriesGroups[groupIndex]
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
        const flipClass = w2.globals.isBarHorizontal ? "apexcharts-flip-x" : "apexcharts-flip-y";
        const wantsFlip = this.barHelpers.arrBorderRadius[realIndex][j] === "bottom" && w2.seriesData.series[realIndex][j] > 0 || this.barHelpers.arrBorderRadius[realIndex][j] === "top" && w2.seriesData.series[realIndex][j] < 0;
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
      w2.globals.seriesXvalues[realIndex] = xArrValues;
      w2.globals.seriesYvalues[realIndex] = yArrValues;
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
    const w2 = this.w;
    if (!Environment.isBrowser()) return;
    const anim = w2.config.chart.animations;
    const hold = (anim.dynamicAnimation.speed || 0) + (anim.speed || 0) + 100;
    setTimeout(() => {
      if (w2.globals.isDestroyed || !Utils.elementExists(w2.dom.baseEl)) return;
      w2.dom.baseEl.querySelectorAll(".apexcharts-flip-held").forEach((el) => {
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
    const w2 = this.w;
    let barHeight, barWidth;
    if (this.isHorizontal) {
      yDivision = w2.layout.gridHeight / w2.globals.dataPoints;
      const userBarHeight = w2.config.plotOptions.bar.barHeight;
      if (String(userBarHeight).indexOf("%") === -1) {
        barHeight = parseInt(userBarHeight, 10);
      } else {
        barHeight = yDivision * parseInt(userBarHeight, 10) / 100;
      }
      zeroW = w2.globals.padHorizontal + (this.isReversed ? w2.layout.gridWidth - this.baseLineInvertedY : this.baseLineInvertedY);
      y = (yDivision - barHeight) / 2;
    } else {
      xDivision = w2.layout.gridWidth / w2.globals.dataPoints;
      barWidth = xDivision;
      const userColumnWidth = w2.config.plotOptions.bar.columnWidth;
      if (w2.axisFlags.isXNumeric && w2.globals.dataPoints > 1) {
        xDivision = w2.globals.minXDiff / this.xRatio;
        barWidth = xDivision * parseInt(this.barOptions.columnWidth, 10) / 100;
      } else if (String(userColumnWidth).indexOf("%") === -1) {
        barWidth = parseInt(userColumnWidth, 10);
      } else {
        barWidth *= parseInt(userColumnWidth, 10) / 100;
      }
      if (this.isReversed) {
        zeroH = this.baseLineY[translationsIndex];
      } else {
        zeroH = w2.layout.gridHeight - this.baseLineY[translationsIndex];
      }
      x = w2.globals.padHorizontal + (xDivision - barWidth) / 2;
    }
    const subDivisions = w2.globals.barGroups.length || 1;
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
    const w2 = this.w;
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
      w2.config.series[realIndex].name
    ) {
      gsi = seriesGroup.indexOf(
        /** @type {Record<string,any>} */
        w2.config.series[realIndex].name
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
      w: w2
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
    const w2 = this.w;
    const i = indexes.i;
    const j = indexes.j;
    const bc = indexes.bc;
    const realIndex = indexes.realIndex;
    const translationsIndex = indexes.translationsIndex;
    if (w2.axisFlags.isXNumeric) {
      let seriesVal = w2.seriesData.seriesX[realIndex][j];
      if (!seriesVal) seriesVal = 0;
      x = (seriesVal - w2.globals.minX) / this.xRatio - barWidth / 2 * w2.globals.barGroups.length;
    }
    const barXPosition = x + columnGroupIndex * barWidth;
    let barYPosition;
    let prevBarH = 0;
    for (let k = 0; k < this.groupCtx.prevYF.length; k++) {
      prevBarH = prevBarH + (!isNaN(this.groupCtx.prevYF[k][j]) ? this.groupCtx.prevYF[k][j] : 0);
    }
    let gsi = i;
    if (seriesGroup) {
      gsi = seriesGroup.indexOf(w2.seriesData.seriesNames[realIndex]);
    }
    if (gsi > 0 && !w2.axisFlags.isXNumeric || gsi > 0 && w2.axisFlags.isXNumeric && w2.seriesData.seriesX[realIndex - 1][j] === w2.seriesData.seriesX[realIndex][j]) {
      let bYP;
      let prevYValue;
      const p2 = Math.min(this.yRatio.length + 1, realIndex + 1);
      if (this.groupCtx.prevY[gsi - 1] !== void 0 && this.groupCtx.prevY[gsi - 1].length) {
        for (let ii = 1; ii < p2; ii++) {
          if (!isNaN((_a = this.groupCtx.prevY[gsi - ii]) == null ? void 0 : _a[j])) {
            prevYValue = this.groupCtx.prevY[gsi - ii][j];
            break;
          }
        }
      }
      for (let ii = 1; ii < p2; ii++) {
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
      if (typeof bYP === "undefined") bYP = w2.layout.gridHeight;
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
      w: w2
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
      x: w2.axisFlags.isXNumeric ? x : x + xDivision,
      y
    };
  }
}
function buildJitterGroups({
  w: w2,
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
  const sMin = useScale && scale.min != null ? scale.min : w2.globals.minY;
  const sMax = useScale && scale.max != null ? scale.max : w2.globals.maxY;
  const span = sMax - sMin || 1;
  const buckets = useScale ? new Array(steps).fill("") : [""];
  for (let k = 0; k < points.length; k += stride) {
    const v2 = points[k];
    const a = alongFn(v2);
    let off = (hash01(seedA * 7919 + seedB * 100003 + k) - 0.5) * 2 * jitterPx;
    if (constrain) {
      const cap = (
        /** @type {(v:number)=>number} */
        clampAt(v2)
      );
      if (off > cap) off = cap;
      if (off < -cap) off = -cap;
    }
    const px = isHorizontal ? a : center + off;
    const py = isHorizontal ? center + off : a;
    const sub = isSquare ? squareSubPath(px, py, r) : circleSubPath(px, py, r);
    if (useScale) {
      let t = (v2 - sMin) / span;
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
  for (let b2 = 0; b2 < steps; b2++) {
    if (!buckets[b2]) continue;
    groups.push({
      fill: rampColorAt(scale.colors, b2 / (steps - 1)),
      d: buckets[b2]
    });
  }
  return groups;
}
function renderJitter({
  graphics,
  w: w2,
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
  const willAnimateIn = w2.config.chart.animations.enabled && !w2.globals.resized && !w2.globals.dataChanged;
  const elPointsWrap = graphics.group({
    class: willAnimateIn ? `${wrapClass} apexcharts-element-hidden` : wrapClass
  });
  if (willAnimateIn) {
    w2.globals.delayedElements.push({ el: elPointsWrap.node });
  }
  pointsByCat.forEach(({ groups, j }) => {
    const catColor = distributed ? w2.globals.colors[j] : w2.globals.colors[realIndex];
    const fc = options.fillColor;
    const defaultFill = fc === "series" ? catColor : fc === "series-dark" ? darkenColor(catColor, 0.45) : fc || darkenColor(catColor, 0.45);
    groups.forEach((g2) => {
      const elPoints = graphics.drawPath({
        d: g2.d,
        fill: g2.fill != null ? g2.fill : defaultFill,
        stroke: strokeW > 0 ? strokeColor : "none",
        strokeWidth: strokeW,
        fillOpacity: pOpacity,
        classes: pointClass
      });
      elPoints.attr("data:realIndex", realIndex);
      elPoints.attr("j", j);
      elPoints.attr("clip-path", `url(#gridRectBarMask${w2.globals.cuid})`);
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
  const mix = (a, b2) => Math.round(a + (b2 - a) * frac);
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
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const type = w2.globals.comboCharts ? ctype : w2.config.chart.type;
    const fill = new Fill(this.w);
    this.candlestickOptions = this.w.config.plotOptions.candlestick;
    this.boxOptions = this.w.config.plotOptions.boxPlot;
    this.isHorizontal = w2.config.plotOptions.bar.horizontal;
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
      this.isBoxPlot = w2.config.chart.type === "boxPlot" || /** @type {Record<string,any>} */
      w2.config.series[i].type === "boxPlot";
      let x;
      let y;
      const yArrj = [];
      const xArrj = [];
      const realIndex = w2.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      const elSeries = graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[realIndex]),
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
        w2.globals.seriesYAxisReverseMap[realIndex][0];
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
      const gridW = w2.layout.gridWidth;
      const cullBuffer = barWidth != null ? barWidth : 0;
      for (let j = 0; j < w2.globals.dataPoints; j++) {
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
            const lineFill = !this.isBoxPlot && this.candlestickOptions.wick.useFillColor ? paths.color[pi] : w2.globals.stroke.colors[i];
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
              type: w2.config.chart.type
            });
          }
        );
        if (boxPointsOpts && boxPointsOpts.show !== false) {
          const pts = (_a = w2.candleData.seriesBoxPoints[realIndex]) == null ? void 0 : _a[j];
          if (pts && pts.length) {
            const logVal = (v2) => (
              /** @type {any} */
              this.coreUtils.getLogValAtSeriesIndex(
                v2,
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
              alongFn = (v2) => z + logVal(v2) / yRatio;
            } else {
              const yRatio = this.yRatio[translationsIndex];
              const bw = barWidth != null ? barWidth : 0;
              const z = zeroH != null ? zeroH : 0;
              center = paths.barXPosition + bw / 2;
              halfExtent = bw / 2;
              alongFn = (v2) => z - logVal(v2) / yRatio;
            }
            const groups = buildJitterGroups({
              w: w2,
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
          w: w2,
          elSeries,
          pointsByCat,
          options: boxPointsOpts,
          distributed: w2.config.plotOptions.bar.distributed,
          realIndex,
          wrapClass: "apexcharts-boxPlot-points-wrap",
          pointClass: "apexcharts-boxPlot-points"
        });
      }
      w2.globals.seriesXvalues[realIndex] = xArrj;
      w2.globals.seriesYvalues[realIndex] = yArrj;
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
    var _a, _b, _c, _d;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const i = indexes.i;
    const j = indexes.j;
    const { colors: candleColors } = w2.config.plotOptions.candlestick;
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
    let m2 = ohlc.m;
    if (w2.axisFlags.isXNumeric) {
      x = (w2.seriesData.seriesX[realIndex][j] - w2.globals.minX) / this.xRatio - barWidth / 2;
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
      m2 = zeroH - ohlc.m / yRatio;
    }
    if (cullBounds && (barXPosition + barWidth < cullBounds.lo || barXPosition > cullBounds.hi)) {
      return {
        pathTo: null,
        pathFrom: null,
        x: w2.axisFlags.isXNumeric ? x : x + xDivision,
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
        graphics.move(barXPosition, y1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 4, l1) + graphics.line(barXPosition + barWidth - barWidth / 4, l1) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth, y1) + graphics.line(barXPosition + barWidth, m2) + graphics.line(barXPosition, m2) + graphics.line(barXPosition, y1 + strokeWidth / 2),
        graphics.move(barXPosition, m2) + graphics.line(barXPosition + barWidth, m2) + graphics.line(barXPosition + barWidth, y2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth - barWidth / 4, l2) + graphics.line(barXPosition + barWidth / 4, l2) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition, y2) + graphics.line(barXPosition, m2) + "z"
      ];
    } else {
      pathTo = [
        graphics.move(barXPosition, y2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth, y2) + graphics.line(barXPosition + barWidth, y1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition, y1) + graphics.line(barXPosition, y2 - strokeWidth / 2)
      ];
    }
    let pathFrom = null;
    const morphFrom = (_d = (_c = this.ctx) == null ? void 0 : _c.morphTypeChange) == null ? void 0 : _d.getInitialPathFor(realIndex, j);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w2.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo[0]);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(barXPosition + barWidth / 2, y1) + graphics.move(barXPosition, y1);
    }
    if (!w2.axisFlags.isXNumeric) {
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
        realIndex,
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
    var _a, _b, _c, _d;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const i = indexes.i;
    const j = indexes.j;
    const realIndex = indexes.realIndex;
    const { colors: candleColors } = w2.config.plotOptions.candlestick;
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
    let m2 = ohlc.m;
    if (w2.axisFlags.isXNumeric) {
      y = (w2.seriesData.seriesX[realIndex][j] - w2.globals.minX) / this.invertedXRatio - barHeight / 2;
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
      m2 = zeroW + ohlc.m / yRatio;
    }
    const pathTo = [
      graphics.move(x1, barYPosition) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2 - barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2 + barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight) + graphics.line(m2, barYPosition + barHeight) + graphics.line(m2, barYPosition) + graphics.line(x1 + strokeWidth / 2, barYPosition),
      graphics.move(m2, barYPosition) + graphics.line(m2, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight - barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition) + graphics.line(m2, barYPosition) + "z"
    ];
    let pathFrom = null;
    const morphFrom = (_d = (_c = this.ctx) == null ? void 0 : _c.morphTypeChange) == null ? void 0 : _d.getInitialPathFor(realIndex, j);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w2.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo[0]);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(x1, barYPosition + barHeight / 2) + graphics.move(x1, barYPosition);
    }
    if (!w2.axisFlags.isXNumeric) {
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
        realIndex,
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
    const w2 = this.w;
    const coreUtils = this.coreUtils;
    const getCandleVal = (arr) => arr[i] && arr[i][j] != null ? (
      /** @type {any} */
      coreUtils.getLogValAtSeriesIndex(arr[i][j], i)
    ) : 0;
    const h = getCandleVal(w2.candleData.seriesCandleH);
    const o = getCandleVal(w2.candleData.seriesCandleO);
    const m2 = getCandleVal(w2.candleData.seriesCandleM);
    const c = getCandleVal(w2.candleData.seriesCandleC);
    const l = getCandleVal(w2.candleData.seriesCandleL);
    return {
      o: this.isBoxPlot ? h : o,
      h: this.isBoxPlot ? o : h,
      m: m2,
      l: this.isBoxPlot ? c : l,
      c: this.isBoxPlot ? l : c
    };
  }
}
const tangents = (points) => {
  const m2 = finiteDifferences(points);
  const n = points.length - 1;
  const ε = 1e-6;
  const tgts = [];
  let a, b2, d, s;
  for (let i = 0; i < n; i++) {
    d = slope(points[i], points[i + 1]);
    if (Math.abs(d) < ε) {
      m2[i] = m2[i + 1] = 0;
    } else {
      a = m2[i] / d;
      b2 = m2[i + 1] / d;
      s = a * a + b2 * b2;
      if (s > 9) {
        s = d * 3 / Math.sqrt(s);
        m2[i] = s * a;
        m2[i + 1] = s * b2;
      }
    }
  }
  for (let i = 0; i <= n; i++) {
    s = (points[Math.min(n, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m2[i] * m2[i]));
    tgts.push([s || 0, m2[i] * s || 0]);
  }
  return tgts;
};
const svgPath = (points) => {
  let p2 = "";
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const n = point.length;
    if (n > 4) {
      p2 += `C${point[0]}, ${point[1]}`;
      p2 += `, ${point[2]}, ${point[3]}`;
      p2 += `, ${point[4]}, ${point[5]}`;
    } else if (n > 2) {
      p2 += `S${point[0]}, ${point[1]}`;
      p2 += `, ${point[2]}, ${point[3]}`;
    }
  }
  return p2;
};
const spline = {
  /**
   * Convert 'points' to bezier
   * @param {any[]} points
   * @returns {any[]}
   */
  points(points) {
    const tgts = tangents(points);
    const p2 = points[1];
    const p0 = points[0];
    const pts = [];
    const t = tgts[1];
    const t0 = tgts[0];
    pts.push(p0, [
      p0[0] + t0[0],
      p0[1] + t0[1],
      p2[0] - t[0],
      p2[1] - t[1],
      p2[0],
      p2[1]
    ]);
    for (let i = 2, n = tgts.length; i < n; i++) {
      const p3 = points[i];
      const t2 = tgts[i];
      pts.push([p3[0] - t2[0], p3[1] - t2[1], p3[0], p3[1]]);
    }
    return pts;
  },
  /**
   * Slice out a segment of 'points'
   * @param {any[]} points
   * @param {Number} start
   * @param {Number} end
   * @returns {any[]}
   */
  slice(points, start, end) {
    const pts = points.slice(start, end);
    if (start) {
      if (end - start > 1 && pts[1].length < 6) {
        const n = pts[0].length;
        pts[1] = [
          pts[0][n - 2] * 2 - pts[0][n - 4],
          pts[0][n - 1] * 2 - pts[0][n - 3]
        ].concat(pts[1]);
      }
      pts[0] = pts[0].slice(-2);
    }
    return pts;
  }
};
function slope(p0, p1) {
  return (p1[1] - p0[1]) / (p1[0] - p0[0]);
}
function finiteDifferences(points) {
  const m2 = [];
  let p0 = points[0];
  let p1 = points[1];
  let d = m2[0] = slope(p0, p1);
  let i = 1;
  for (let n = points.length - 1; i < n; i++) {
    p0 = p1;
    p1 = points[i + 1];
    m2[i] = (d + (d = slope(p0, p1))) * 0.5;
  }
  m2[i] = d;
  return m2;
}
class Violin extends Bar {
  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} [seriesIndex]
   */
  // @ts-ignore -- Violin.draw has extra ctype param compared to Bar.draw
  draw(series, ctype, seriesIndex) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    this.violinOptions = w2.config.plotOptions.violin;
    this.pointsOptions = this.violinOptions.points;
    this.bandwidthScale = this.violinOptions.bandwidthScale || 1;
    this.normalize = this.violinOptions.normalize || "individual";
    this.distributed = w2.config.plotOptions.bar.distributed;
    this.isHorizontal = w2.config.plotOptions.bar.horizontal;
    this.coreUtils = new CoreUtils(this.w);
    series = this.coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = this.coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: "apexcharts-violin-series apexcharts-plot-series"
    });
    for (let i = 0; i < series.length; i++) {
      let x;
      let y;
      const yArrj = [];
      const xArrj = [];
      const realIndex = w2.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      const elSeries = graphics.group({
        class: "apexcharts-series",
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[realIndex]),
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
        w2.globals.seriesYAxisReverseMap[realIndex][0];
        translationsIndex = realIndex;
      }
      const initPositions = this.barHelpers.initialPositions(realIndex);
      const {
        y: initY,
        barHeight,
        yDivision,
        zeroW,
        x: initX,
        barWidth,
        xDivision,
        zeroH
      } = initPositions;
      y = initY;
      x = initX;
      xArrj.push(x + (barWidth != null ? barWidth : 0) / 2);
      const elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      this.seriesMaxWeight = 0;
      if (this.normalize === "group") {
        const dens = w2.violinData.seriesViolinDensity[realIndex] || [];
        dens.forEach((d) => {
          if (d && d.maxWeight > this.seriesMaxWeight) {
            this.seriesMaxWeight = d.maxWeight;
          }
        });
      }
      const pointsByViolin = [];
      for (let j = 0; j < w2.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        const paths = this.isHorizontal ? this.drawHorizontalViolin({
          indexes: { i, j, realIndex, translationsIndex },
          y,
          yDivision,
          barHeight,
          zeroW
        }) : this.drawVerticalViolin({
          indexes: { i, j, realIndex, translationsIndex },
          x,
          xDivision,
          barWidth,
          zeroH
        });
        x = paths.x;
        y = paths.y;
        if (j > 0) {
          xArrj.push(paths.center);
        }
        yArrj.push(paths.alongRepresentative);
        const pointGroups = this.buildPointsSubPath({
          realIndex,
          j,
          center: paths.center,
          halfExtent: paths.halfExtent,
          alongFn: paths.alongFn,
          density: paths.density,
          maxWeight: paths.maxWeight
        });
        if (pointGroups.length) pointsByViolin.push({ groups: pointGroups, j });
        const pathFill = fill.fillPath({
          // distributed → color per category (data point) instead of per series
          seriesNumber: this.distributed ? j : realIndex,
          dataPointIndex: j,
          color: this.distributed ? w2.globals.colors[j] : void 0,
          value: series[i][j]
        });
        this.renderSeries({
          realIndex,
          pathFill,
          lineFill: w2.globals.stroke.colors[realIndex],
          j,
          i,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          columnGroupIndex,
          barHeight,
          barWidth,
          elDataLabelsWrap,
          visibleSeries: this.visibleI,
          type: "violin"
        });
        const bodyEl = elSeries.node.querySelector(
          `path.apexcharts-violin-area[j='${j}']`
        );
        if (bodyEl && isFinite(paths.alongRepresentative)) {
          bodyEl.setAttribute(
            this.isHorizontal ? "cx" : "cy",
            `${paths.alongRepresentative}`
          );
        }
      }
      renderJitter({
        graphics,
        w: w2,
        elSeries,
        pointsByCat: pointsByViolin,
        options: this.pointsOptions,
        distributed: this.distributed,
        realIndex,
        wrapClass: "apexcharts-violin-points-wrap",
        pointClass: "apexcharts-violin-points"
      });
      w2.globals.seriesXvalues[realIndex] = xArrj;
      w2.globals.seriesYvalues[realIndex] = yArrj;
      ret.add(elSeries);
    }
    return ret;
  }
  /** @param {{indexes: any, x: any, xDivision: any, barWidth: any, zeroH: any}} opts */
  drawVerticalViolin({ indexes, x, xDivision, barWidth, zeroH }) {
    var _a, _b, _c;
    const w2 = this.w;
    const { realIndex, j, translationsIndex } = indexes;
    const yRatio = this.yRatio[translationsIndex];
    if (w2.axisFlags.isXNumeric) {
      x = (w2.seriesData.seriesX[realIndex][j] - w2.globals.minX) / this.xRatio - barWidth / 2;
    }
    const barXPosition = x + barWidth * this.visibleI;
    const center = barXPosition + barWidth / 2;
    const halfExtent = barWidth / 2;
    const density = this.getDensity(realIndex, j);
    const maxWeight = this.effectiveMaxWeight(density);
    const alongFn = (v2) => zeroH - this.logVal(v2, realIndex) / yRatio;
    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center,
      halfExtent,
      maxWeight,
      vertical: true,
      alongFn,
      collapsed: false
    });
    let pathFrom = null;
    const morphFrom = (_b = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange) == null ? void 0 : _b.getInitialPathFor(realIndex, j);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w2.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center,
        halfExtent,
        maxWeight,
        vertical: true,
        alongFn,
        collapsed: true
      });
    }
    if (!w2.axisFlags.isXNumeric) {
      x = x + xDivision;
    }
    return {
      pathTo,
      pathFrom,
      x,
      y: zeroH,
      center,
      halfExtent,
      alongFn,
      density,
      maxWeight,
      alongRepresentative: alongFn((_c = this.series[indexes.i][j]) != null ? _c : 0)
    };
  }
  /** @param {{indexes: any, y: any, yDivision: any, barHeight: any, zeroW: any}} opts */
  drawHorizontalViolin({ indexes, y, yDivision, barHeight, zeroW }) {
    var _a, _b, _c;
    const w2 = this.w;
    const { realIndex, j } = indexes;
    const yRatio = this.invertedYRatio;
    if (w2.axisFlags.isXNumeric) {
      y = (w2.seriesData.seriesX[realIndex][j] - w2.globals.minX) / this.invertedXRatio - barHeight / 2;
    }
    const barYPosition = y + barHeight * this.visibleI;
    const center = barYPosition + barHeight / 2;
    const halfExtent = barHeight / 2;
    const density = this.getDensity(realIndex, j);
    const maxWeight = this.effectiveMaxWeight(density);
    const alongFn = (v2) => zeroW + this.logVal(v2, realIndex) / yRatio;
    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center,
      halfExtent,
      maxWeight,
      vertical: false,
      alongFn,
      collapsed: false
    });
    let pathFrom = null;
    const morphFrom = (_b = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange) == null ? void 0 : _b.getInitialPathFor(realIndex, j);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w2.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center,
        halfExtent,
        maxWeight,
        vertical: false,
        alongFn,
        collapsed: true
      });
    }
    if (!w2.axisFlags.isXNumeric) {
      y = y + yDivision;
    }
    return {
      pathTo,
      pathFrom,
      x: zeroW,
      y,
      center,
      halfExtent,
      alongFn,
      maxWeight,
      density,
      alongRepresentative: alongFn((_c = this.series[indexes.i][j]) != null ? _c : 0)
    };
  }
  /**
   * Read the parsed density for one violin and return sorted, de-duplicated
   * nodes (strictly increasing value — a hard requirement for the spline).
   * @param {number} realIndex
   * @param {number} j
   */
  getDensity(realIndex, j) {
    var _a;
    const w2 = this.w;
    const d = (_a = w2.violinData.seriesViolinDensity[realIndex]) == null ? void 0 : _a[j];
    if (!d || !d.values.length) {
      return { nodes: [], maxWeight: 0 };
    }
    const order = d.values.map(
      (_, k) => k
    );
    order.sort(
      (a, b2) => d.values[a] - d.values[b2]
    );
    const nodes = [];
    let prevV = null;
    for (const k of order) {
      const v2 = d.values[k];
      if (prevV !== null && v2 === prevV) continue;
      nodes.push({ v: v2, w: d.weights[k] });
      prevV = v2;
    }
    return { nodes, maxWeight: d.maxWeight };
  }
  /**
   * The peak weight used to scale a violin's width: its own ('individual') or
   * the densest violin in the series ('group', preserving relative widths).
   * @param {{maxWeight:number}} density
   */
  effectiveMaxWeight(density) {
    return this.normalize === "group" && this.seriesMaxWeight > 0 ? this.seriesMaxWeight : density.maxWeight;
  }
  /**
   * Build the closed, smooth violin outline. The value axis is the monotonic
   * parameter for the spline (vertical → Y, horizontal → X); the spline is fed
   * with that axis first and the control points swapped back to screen space.
   *
   * @param {{nodes:{v:number,w:number}[], center:number, halfExtent:number, maxWeight:number, vertical:boolean, alongFn:(v:number)=>number, collapsed:boolean}} opts
   */
  buildBodyPath({
    nodes,
    center,
    halfExtent,
    maxWeight,
    vertical,
    alongFn,
    collapsed
  }) {
    const graphics = new Graphics(this.w);
    if (nodes.length === 0) {
      const a = alongFn(0);
      return vertical ? graphics.move(center, a) + graphics.line(center, a) : graphics.move(a, center) + graphics.line(a, center);
    }
    const wpxOf = (weight) => {
      if (collapsed || maxWeight <= 0) return 0;
      const wp = weight / maxWeight * halfExtent * this.bandwidthScale;
      return Math.min(halfExtent, Math.max(0, wp));
    };
    const rightPts = [];
    const leftPts = [];
    for (let k = 0; k < nodes.length; k++) {
      const a = alongFn(nodes[k].v);
      const wp = wpxOf(nodes[k].w);
      if (vertical) {
        rightPts.push([center + wp, a]);
        leftPts.push([center - wp, a]);
      } else {
        rightPts.push([a, center + wp]);
        leftPts.push([a, center - wp]);
      }
    }
    leftPts.reverse();
    return this.smoothSegment(rightPts, vertical, false) + this.smoothSegment(leftPts, vertical, true) + "z";
  }
  /**
   * Emit one edge as a smooth (monotone-cubic) path segment, or a polyline
   * when there are too few nodes for a spline.
   *
   * @param {[number,number][]} screenPts ordered screen points for this edge
   * @param {boolean} monotonicIsY true when the value axis is vertical
   * @param {boolean} continued false → start with M; true → start with L (joins the previous edge)
   */
  smoothSegment(screenPts, monotonicIsY, continued) {
    const graphics = new Graphics(this.w);
    const first = screenPts[0];
    let d = continued ? graphics.line(first[0], first[1]) : graphics.move(first[0], first[1]);
    const usePolyline = screenPts.length < 3 || !this.strictlyMonotonic(screenPts, monotonicIsY);
    if (usePolyline) {
      for (let k = 1; k < screenPts.length; k++) {
        d += graphics.line(screenPts[k][0], screenPts[k][1]);
      }
      return d;
    }
    const input = screenPts.map(
      ([px, py]) => monotonicIsY ? [py, px] : [px, py]
    );
    const bez = spline.points(input);
    const out = monotonicIsY ? bez.map(swapPairs) : bez;
    d += svgPath(out);
    return d;
  }
  /**
   * @param {[number,number][]} screenPts
   * @param {boolean} monotonicIsY
   */
  strictlyMonotonic(screenPts, monotonicIsY) {
    const axis = monotonicIsY ? 1 : 0;
    for (let k = 1; k < screenPts.length; k++) {
      if (screenPts[k][axis] === screenPts[k - 1][axis]) return false;
    }
    return true;
  }
  /**
   * Build the jitter sub-paths for one violin, grouped for rendering. Returns
   * `[]` when points are hidden or absent. Normally one group (single dot
   * colour); with `points.colorScale` the dots are bucketed by value into shade
   * groups, each carrying its ramp colour. Offsets are a deterministic index
   * hash (SSR-safe); points beyond maxPoints are stride-thinned.
   *
   * @param {{realIndex:number, j:number, center:number, halfExtent:number, alongFn:(v:number)=>number, density:{nodes:{v:number,w:number}[], maxWeight:number}, maxWeight:number}} opts
   * @returns {{fill:string|null, d:string}[]}
   */
  buildPointsSubPath({
    realIndex,
    j,
    center,
    halfExtent,
    alongFn,
    density,
    maxWeight
  }) {
    var _a;
    return buildJitterGroups({
      w: this.w,
      points: (_a = this.w.violinData.seriesViolinPoints[realIndex]) == null ? void 0 : _a[j],
      seedA: realIndex,
      seedB: j,
      center,
      halfExtent,
      alongFn,
      isHorizontal: this.isHorizontal,
      options: this.pointsOptions,
      // Violin clamps jitter to the density half-width at each value so dots
      // stay inside the shape.
      clampAt: (v2) => this.halfWidthAtValue(v2, density, halfExtent, maxWeight)
    });
  }
  /**
   * Density half-width (pixels) at a given value — used to keep jitter inside
   * the violin. Linear interpolation between the two nearest density nodes.
   * @param {number} value
   * @param {{nodes:{v:number,w:number}[], maxWeight:number}} density
   * @param {number} halfExtent
   * @param {number} [maxWeightOverride] use the group max for 'group' normalize
   */
  halfWidthAtValue(value, density, halfExtent, maxWeightOverride) {
    const { nodes } = density;
    const maxWeight = maxWeightOverride != null ? maxWeightOverride : density.maxWeight;
    if (!nodes.length || maxWeight <= 0) return 0;
    const toPx = (weight) => Math.min(
      halfExtent,
      weight / maxWeight * halfExtent * this.bandwidthScale
    );
    if (value <= nodes[0].v) return toPx(nodes[0].w);
    if (value >= nodes[nodes.length - 1].v)
      return toPx(nodes[nodes.length - 1].w);
    for (let k = 1; k < nodes.length; k++) {
      if (value <= nodes[k].v) {
        const a = nodes[k - 1];
        const b2 = nodes[k];
        const t = b2.v === a.v ? 0 : (value - a.v) / (b2.v - a.v);
        return toPx(a.w + (b2.w - a.w) * t);
      }
    }
    return 0;
  }
  /**
   * Apply the y-axis log transform to a value when that axis is logarithmic,
   * mirroring BoxCandleStick. Linear axes return the value unchanged.
   * @param {number} value
   * @param {number} realIndex
   */
  logVal(value, realIndex) {
    return (
      /** @type {any} */
      this.coreUtils.getLogValAtSeriesIndex(
        value,
        realIndex
      )
    );
  }
}
function swapPairs(arr) {
  const out = [];
  for (let k = 0; k < arr.length; k += 2) {
    out.push(arr[k + 1], arr[k]);
  }
  return out;
}
class TreemapHelpers {
  /**
   * @param {import('../../../types/internal').ChartStateW} w
   * @param {import('../../../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.ctx = ctx;
    this.w = w2;
  }
  checkColorRange() {
    const w2 = this.w;
    let negRange = false;
    const chartOpts = w2.config.plotOptions[w2.config.chart.type];
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
    const w2 = this.w;
    let colorShadePercent = 1;
    const shadeIntensity = w2.config.plotOptions[chartType].shadeIntensity;
    const colorProps = this.determineColor(chartType, i, j);
    if (
      /** @type {any} */
      w2.globals.hasNegs || negRange
    ) {
      if (w2.config.plotOptions[chartType].reverseNegativeShade) {
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
    if (w2.config.plotOptions[chartType].enableShades) {
      if (this.w.config.theme.mode === "dark") {
        const shadeColor = utils.shadeColor(
          colorShadePercent * -1,
          colorProps.color
        );
        color = Utils.hexToRgba(
          Utils.isColorHex(shadeColor) ? shadeColor : Utils.rgb2hex(shadeColor),
          w2.config.fill.opacity
        );
      } else {
        const shadeColor = utils.shadeColor(colorShadePercent, colorProps.color);
        color = Utils.hexToRgba(
          Utils.isColorHex(shadeColor) ? shadeColor : Utils.rgb2hex(shadeColor),
          w2.config.fill.opacity
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
    const w2 = this.w;
    const val = w2.seriesData.series[i][j];
    const chartOpts = w2.config.plotOptions[chartType];
    let seriesNumber = chartOpts.colorScale.inverse ? j : i;
    if (chartOpts.distributed && w2.config.chart.type === "treemap") {
      seriesNumber = j;
    }
    let color = w2.globals.colors[seriesNumber];
    let foreColor = null;
    let min;
    let max;
    if (!chartOpts.distributed && chartType === "heatmap") {
      min = w2.globals.minY;
      max = w2.globals.maxY;
    } else {
      const row = w2.seriesData.series[i];
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
      min = csMin < w2.globals.minY ? csMin : w2.globals.minY;
      max = csMax > w2.globals.maxY ? csMax : w2.globals.maxY;
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
    const w2 = this.w;
    const dataLabelsConfig = w2.config.dataLabels;
    const graphics = new Graphics(this.w);
    const dataLabels = new DataLabels(this.w, this.ctx);
    let elDataLabelsWrap = null;
    if (dataLabelsConfig.enabled) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels"
      });
      const offX = resolveDataLabelOffset(dataLabelsConfig.offsetX, w2, i, j);
      const offY = resolveDataLabelOffset(dataLabelsConfig.offsetY, w2, i, j);
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
class HeatMap {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  constructor(w2, ctx, xyRatios) {
    this.ctx = ctx;
    this.w = w2;
    this.xRatio = xyRatios.xRatio;
    this.yRatio = xyRatios.yRatio;
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation;
    this.helpers = new TreemapHelpers(w2, ctx);
    this.rectRadius = this.w.config.plotOptions.heatmap.radius;
    this.strokeWidth = this.w.config.stroke.show ? this.w.config.stroke.width : 0;
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    var _a, _b;
    const w2 = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const emit = seriesEmitter(this.ctx, graphics);
    const useCanvas = emit !== graphics && typeof emit.drawRectCell === "function";
    const ret = graphics.group({
      class: "apexcharts-heatmap"
    });
    ret.attr("clip-path", `url(#gridRectMask${w2.globals.cuid})`);
    const xDivision = w2.layout.gridWidth / w2.globals.dataPoints;
    const yDivision = w2.layout.gridHeight / w2.seriesData.series.length;
    const isContinuousX = (w2.config.xaxis.type === "numeric" || w2.config.xaxis.type === "datetime") && w2.axisFlags.isXNumeric && this.xRatio > 0;
    let binPx = xDivision;
    if (isContinuousX) {
      const diff = w2.globals.minXDiff;
      binPx = Number.isFinite(diff) && diff > 0 ? diff / this.xRatio : xDivision;
    }
    const cellFillOpacity = Array.isArray(w2.config.fill.opacity) ? (_a = w2.config.fill.opacity[0]) != null ? _a : 1 : (_b = w2.config.fill.opacity) != null ? _b : 1;
    let y1 = 0;
    let rev = false;
    this.negRange = this.helpers.checkColorRange();
    const heatSeries = series.slice();
    if (w2.config.yaxis[0].reversed) {
      rev = true;
      heatSeries.reverse();
    }
    for (let i = rev ? 0 : heatSeries.length - 1; rev ? i < heatSeries.length : i >= 0; rev ? i++ : i--) {
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-heatmap-series`,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, i);
      if (!useCanvas) {
        graphics.setupEventDelegation(elSeries, ".apexcharts-heatmap-rect");
      }
      if (w2.config.chart.dropShadow.enabled) {
        const shadow = w2.config.chart.dropShadow;
        const filters = new Filters(this.w);
        filters.dropShadow(elSeries, shadow, i);
      }
      let x1 = 0;
      const shadeIntensity = w2.config.plotOptions.heatmap.shadeIntensity;
      let j = 0;
      for (let dIndex = 0; dIndex < w2.globals.dataPoints; dIndex++) {
        if (!isContinuousX && w2.seriesData.seriesX.length && !w2.globals.allSeriesHasEqualX) {
          if (w2.globals.minX + w2.globals.minXDiff * dIndex < w2.seriesData.seriesX[i][j]) {
            x1 = x1 + xDivision;
            continue;
          }
        }
        if (j >= heatSeries[i].length) break;
        const cellW = isContinuousX ? binPx : xDivision;
        if (isContinuousX) {
          const xVal = w2.seriesData.seriesX[i] ? w2.seriesData.seriesX[i][j] : null;
          if (xVal == null || xVal !== xVal) {
            j++;
            continue;
          }
          x1 = (xVal - w2.globals.minX) / this.xRatio - binPx / 2;
        }
        const heatColor = this.helpers.getShadeColor(
          w2.config.chart.type,
          i,
          j,
          this.negRange
        );
        let color = heatColor.color;
        const heatColorProps = heatColor.colorProps;
        if (w2.config.fill.type === "image") {
          const fill = new Fill(this.w);
          color = fill.fillPath({
            seriesNumber: i,
            dataPointIndex: j,
            opacity: (
              /** @type {any} */
              w2.globals.hasNegs ? heatColorProps.percent < 0 ? 1 - (1 + heatColorProps.percent / 100) : shadeIntensity + heatColorProps.percent / 100 : heatColorProps.percent / 100
            ),
            patternID: Utils.randomId(),
            width: w2.config.fill.image.width ? w2.config.fill.image.width : cellW,
            height: w2.config.fill.image.height ? w2.config.fill.image.height : yDivision
          });
        }
        const radius = this.rectRadius;
        const stroke = w2.config.plotOptions.heatmap.useFillColorAsStroke ? color : w2.globals.stroke.colors[0];
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
          const rect = graphics.drawRect(x1, y1, cellW, yDivision, radius);
          rect.attr({
            cx: x1,
            cy: y1
          });
          rect.node.classList.add("apexcharts-heatmap-rect");
          elSeries.add(rect);
          rect.attr({
            fill: color,
            i,
            index: i,
            j,
            val: series[i][j],
            "stroke-width": this.strokeWidth,
            stroke,
            color
          });
          if (w2.config.chart.animations.enabled && !w2.globals.dataChanged) {
            let speed = 1;
            if (!w2.globals.resized) {
              speed = w2.config.chart.animations.speed;
            }
            this.animateHeatMap(rect, x1, y1, cellW, yDivision, speed, i, j);
          }
          if (w2.globals.dataChanged) {
            let speed = 1;
            if (this.dynamicAnim.enabled && w2.globals.shouldAnimate) {
              speed = this.dynamicAnim.speed;
              let colorFrom = w2.globals.previousPaths[i] && w2.globals.previousPaths[i][j] && w2.globals.previousPaths[i][j].color;
              if (!colorFrom) colorFrom = "rgba(255, 255, 255, 0)";
              this.animateHeatColor(
                rect,
                Utils.isColorHex(colorFrom) ? colorFrom : Utils.rgb2hex(colorFrom),
                Utils.isColorHex(color) ? color : Utils.rgb2hex(color),
                speed
              );
            }
          }
        }
        const formatter = w2.config.dataLabels.formatter;
        const formattedText = formatter(w2.seriesData.series[i][j], {
          value: w2.seriesData.series[i][j],
          seriesIndex: i,
          dataPointIndex: j,
          w: w2
        });
        const dataLabels = this.helpers.calculateDataLabels({
          text: formattedText,
          x: x1 + cellW / 2,
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
      w2.globals.yAxisScale[0].result.slice()
    );
    if (w2.config.yaxis[0].reversed) {
      yAxisScale.unshift("");
    } else {
      yAxisScale.push("");
    }
    w2.globals.yAxisScale[0].result = yAxisScale;
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
    const w2 = this.w;
    const animations = new Animations(this.w);
    const animCfg = w2.config.chart.animations;
    const gradCfg = animCfg.animateGradually;
    const staggerEnabled = gradCfg && gradCfg.enabled !== false;
    let delay = 0;
    if (staggerEnabled) {
      const seriesCount = (w2.seriesData.series || []).length || 1;
      const pointsCount = w2.globals.dataPoints || 1;
      const maxDiag = seriesCount + pointsCount - 2;
      const baseDelay = Math.min(
        gradCfg.delay || 0,
        speed * 0.5 / Math.max(1, maxDiag)
      );
      delay = computeStagger({
        style: "diagonal",
        index: col,
        row,
        col,
        baseDelay
      });
    }
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
class Helpers4 {
  /**
   * @param {import('../../../charts/Line').default} lineCtx
   */
  constructor(lineCtx) {
    this.w = lineCtx.w;
    this.lineCtx = lineCtx;
  }
  /**
   * @param {number} i
   * @param {any[]} series
   */
  sameValueSeriesFix(i, series) {
    const w2 = this.w;
    if (w2.config.fill.type === "gradient" || w2.config.fill.type[i] === "gradient") {
      const coreUtils = new CoreUtils(this.lineCtx.w);
      if (coreUtils.seriesHaveSameValues(i)) {
        const gSeries = series[i].slice();
        gSeries[gSeries.length - 1] = gSeries[gSeries.length - 1] + 1e-6;
        series[i] = gSeries;
      }
    }
    return series;
  }
  /** @param {{series: any, realIndex: any, x: any, y: any, i: any, j: any, prevY: any}} opts */
  calculatePoints({ series, realIndex, x, y, i, j, prevY }) {
    const w2 = this.w;
    const ptX = [];
    const ptY = [];
    let xPT1st = this.lineCtx.categoryAxisCorrection + w2.config.markers.offsetX;
    if (w2.axisFlags.isXNumeric) {
      xPT1st = (w2.seriesData.seriesX[realIndex][0] - w2.globals.minX) / this.lineCtx.xRatio + w2.config.markers.offsetX;
    }
    if (j === 0) {
      ptX.push(xPT1st);
      ptY.push(
        Utils.isNumber(series[i][0]) ? prevY + w2.config.markers.offsetY : null
      );
    }
    ptX.push(x + w2.config.markers.offsetX);
    ptY.push(
      Utils.isNumber(series[i][j + 1]) ? y + w2.config.markers.offsetY : null
    );
    return {
      x: ptX,
      y: ptY
    };
  }
  /** @param {{pathFromLine: any, pathFromArea: any, realIndex: any}} opts */
  checkPreviousPaths({ pathFromLine, pathFromArea, realIndex }) {
    const w2 = this.w;
    for (let pp = 0; pp < w2.globals.previousPaths.length; pp++) {
      const gpp = w2.globals.previousPaths[pp];
      if ((gpp.type === "line" || gpp.type === "area") && gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(realIndex, 10)) {
        if (gpp.type === "line") {
          this.lineCtx.appendPathFrom = false;
          pathFromLine = w2.globals.previousPaths[pp].paths[0].d;
        } else if (gpp.type === "area") {
          this.lineCtx.appendPathFrom = false;
          pathFromArea = w2.globals.previousPaths[pp].paths[0].d;
          if (w2.config.stroke.show && w2.globals.previousPaths[pp].paths[1]) {
            pathFromLine = w2.globals.previousPaths[pp].paths[1].d;
          }
        }
      }
    }
    return {
      pathFromLine,
      pathFromArea
    };
  }
  /** @param {{i: any, realIndex: any, series: any, prevY: any, lineYPosition: any, translationsIndex: any}} opts */
  determineFirstPrevY({
    i,
    realIndex,
    series,
    prevY,
    lineYPosition,
    translationsIndex
  }) {
    var _a, _b, _c;
    const w2 = this.w;
    const stackSeries = w2.config.chart.stacked && !w2.globals.comboCharts || w2.config.chart.stacked && w2.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || /** @type {any} */
    ((_a = this.w.config.series[realIndex]) == null ? void 0 : _a.type) === "bar" || /** @type {any} */
    ((_b = this.w.config.series[realIndex]) == null ? void 0 : _b.type) === "column");
    if (typeof ((_c = series[i]) == null ? void 0 : _c[0]) !== "undefined") {
      if (stackSeries) {
        if (i > 0) {
          const top = this.lineCtx.stackTopAt(realIndex, 0);
          lineYPosition = top === void 0 ? this.lineCtx.zeroY : top;
        } else {
          lineYPosition = this.lineCtx.zeroY;
        }
      } else {
        lineYPosition = this.lineCtx.zeroY;
      }
      prevY = lineYPosition - series[i][0] / this.lineCtx.yRatio[translationsIndex] + (this.lineCtx.isReversed ? series[i][0] / this.lineCtx.yRatio[translationsIndex] : 0) * 2;
    } else {
      if (stackSeries && i > 0 && typeof series[i][0] === "undefined") {
        for (let s = i - 1; s >= 0; s--) {
          if (series[s][0] !== null && typeof series[s][0] !== "undefined") {
            lineYPosition = this.lineCtx.prevSeriesY[s][0];
            prevY = lineYPosition;
            break;
          }
        }
      }
    }
    return {
      prevY,
      lineYPosition
    };
  }
}
function detectStreamScroll(w2, realIndex, newXPixels, newYPixels) {
  var _a;
  const gl = w2.globals;
  const frame = gl.prevStreamFrame;
  if (!frame || !gl.dataChanged || !((_a = w2.axisFlags) == null ? void 0 : _a.isXNumeric)) return null;
  const oldX = frame.seriesX[realIndex];
  const oldY = frame.seriesY[realIndex];
  const newX = w2.seriesData.seriesX[realIndex];
  const newY = w2.seriesData.series[realIndex];
  if (!oldX || !oldY || !newX || !newY) return null;
  if (oldX.length < 3 || newX.length < 3) return null;
  let k = -1;
  for (let i = 0; i < oldX.length; i++) {
    if (oldX[i] === newX[0]) {
      k = i;
      break;
    }
  }
  if (k === -1) return null;
  const overlap = Math.min(oldX.length - k, newX.length);
  if (overlap < 2) return null;
  const appended = newX.length - overlap;
  if (k === 0 && appended === 0) return null;
  for (let i = 0; i < overlap; i++) {
    if (oldX[k + i] !== newX[i]) return null;
    const oy = oldY[k + i];
    const ny = newY[i];
    if (oy !== ny && !(oy == null && ny == null)) return null;
  }
  const oldXP = frame.xPixels[realIndex];
  const oldYP = frame.yPixels[realIndex];
  if (!oldXP || !oldYP) return null;
  let a = -1;
  let b2 = -1;
  for (let i = 0; i < overlap; i++) {
    if (oldXP[k + i] == null || oldYP[k + i] == null || newXPixels[i] == null || newYPixels[i] == null) {
      continue;
    }
    if (a === -1) a = i;
    b2 = i;
  }
  if (a === -1 || b2 <= a) return null;
  const nxA = (
    /** @type {number} */
    newXPixels[a]
  );
  const nxB = (
    /** @type {number} */
    newXPixels[b2]
  );
  const oxA = (
    /** @type {number} */
    oldXP[k + a]
  );
  const oxB = (
    /** @type {number} */
    oldXP[k + b2]
  );
  if (Math.abs(nxB - nxA) < 1e-6) return null;
  const ax = (oxB - oxA) / (nxB - nxA);
  const bx = oxA - ax * nxA;
  if (!isFinite(ax) || !isFinite(bx)) return null;
  if (Math.abs(ax - 1) > 0.02) return null;
  if (Math.abs(bx) < 0.5) return null;
  let yLo = a;
  let yHi = a;
  for (let i = a; i <= b2; i++) {
    const ny = newYPixels[i];
    if (ny == null || oldYP[k + i] == null) continue;
    if (ny < /** @type {number} */
    newYPixels[yLo]) yLo = i;
    if (ny > /** @type {number} */
    newYPixels[yHi]) yHi = i;
  }
  let ay = 1;
  let by = 0;
  const nyLo = (
    /** @type {number} */
    newYPixels[yLo]
  );
  const nyHi = (
    /** @type {number} */
    newYPixels[yHi]
  );
  if (Math.abs(nyHi - nyLo) > 1e-6) {
    ay = /** @type {number} */
    (oldYP[k + yHi] - /** @type {number} */
    oldYP[k + yLo]) / (nyHi - nyLo);
    by = /** @type {number} */
    oldYP[k + yLo] - ay * nyLo;
  } else {
    by = /** @type {number} */
    oldYP[k + yLo] - nyLo;
  }
  if (!isFinite(ay) || !isFinite(by) || ay < 0.2 || ay > 5) return null;
  const m2 = Math.floor((a + b2) / 2);
  if (m2 !== a && m2 !== b2 && newXPixels[m2] != null && oldXP[k + m2] != null) {
    const predX = ax * /** @type {number} */
    newXPixels[m2] + bx;
    if (Math.abs(predX - /** @type {number} */
    oldXP[k + m2]) > 1.5) {
      return null;
    }
    if (newYPixels[m2] != null && oldYP[k + m2] != null) {
      const predY = ay * /** @type {number} */
      newYPixels[m2] + by;
      if (Math.abs(predY - /** @type {number} */
      oldYP[k + m2]) > 1.5) {
        return null;
      }
    }
  }
  gl.streamScrolled = true;
  return { ax, bx, ay, by };
}
const NUM_RE = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
function projectPathToPrevFrame(d, t) {
  const { ax, bx, ay, by } = t;
  const out = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match;
  while ((match = re.exec(d)) !== null) {
    const cmd = match[1].toUpperCase();
    const nums = (match[2].match(NUM_RE) || []).map(parseFloat);
    if (cmd === "Z") {
      out.push("z");
      continue;
    }
    if (cmd === "H") {
      for (const x of nums) out.push(`H ${ax * x + bx}`);
      continue;
    }
    if (cmd === "V") {
      for (const y of nums) out.push(`V ${ay * y + by}`);
      continue;
    }
    if (cmd === "A") {
      for (let i = 0; i + 6 < nums.length; i += 7) {
        out.push(
          `A ${nums[i]} ${nums[i + 1]} ${nums[i + 2]} ${nums[i + 3]} ${nums[i + 4]} ${ax * nums[i + 5] + bx} ${ay * nums[i + 6] + by}`
        );
      }
      continue;
    }
    const coords = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push(`${ax * nums[i] + bx} ${ay * nums[i + 1] + by}`);
    }
    if (coords.length) out.push(`${cmd} ${coords.join(" ")}`);
  }
  return out.join(" ");
}
class Line {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   * @param {boolean} isPointsChart
   */
  constructor(w2, ctx, xyRatios, isPointsChart) {
    this.ctx = ctx;
    this.w = w2;
    this.xyRatios = xyRatios;
    this.xRatio = 0;
    this.yRatio = [];
    this.zRatio = 0;
    this.baseLineY = [];
    this.pointsChart = !(this.w.config.chart.type !== "bubble" && this.w.config.chart.type !== "scatter") || isPointsChart;
    this.scatter = new Scatter(this.w, this.ctx);
    this.noNegatives = this.w.globals.minX === Number.MAX_VALUE;
    this.lineHelpers = new Helpers4(this);
    this.markers = new Markers(this.w, this.ctx);
    this.prevSeriesY = [];
    this.prevSeriesYByX = /* @__PURE__ */ new Map();
    this.categoryAxisCorrection = 0;
    this.yaxisIndex = 0;
    this.xDivision = 0;
    this.zeroY = 0;
    this.areaBottomY = 0;
    this.strokeWidth = 0;
    this.isReversed = false;
    this.appendPathFrom = false;
    this.elSeries = null;
    this.elPointsMain = null;
    this.elDataLabelsWrap = null;
    this._elLastPointsWrap = null;
  }
  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} seriesIndex
   * @param {any} seriesRangeEnd
   */
  draw(series, ctype, seriesIndex, seriesRangeEnd) {
    var _a;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const type = w2.globals.comboCharts ? ctype : w2.config.chart.type;
    const ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`
    });
    const coreUtils = new CoreUtils(this.w);
    this.yRatio = this.xyRatios.yRatio;
    this.zRatio = this.xyRatios.zRatio;
    this.xRatio = this.xyRatios.xRatio;
    this.baseLineY = this.xyRatios.baseLineY;
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.prevSeriesY = [];
    this.prevSeriesYByX = /* @__PURE__ */ new Map();
    const allSeries = [];
    for (let i = 0; i < series.length; i++) {
      series = this.lineHelpers.sameValueSeriesFix(i, series);
      const realIndex = w2.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const translationsIndex = this.yRatio.length > 1 ? realIndex : 0;
      this._initSerieVariables(series, i, realIndex);
      const yArrj = [];
      const y2Arrj = [];
      const xArrj = [];
      let x = w2.globals.padHorizontal + this.categoryAxisCorrection;
      const y = 1;
      const linePaths = [];
      const areaPaths = [];
      Series.addCollapsedClassToSeries(this.w, this.elSeries, realIndex);
      if (w2.axisFlags.isXNumeric && w2.seriesData.seriesX.length > 0) {
        x = (w2.seriesData.seriesX[realIndex][0] - w2.globals.minX) / this.xRatio;
      }
      xArrj.push(x);
      const pX = x;
      let pY2;
      const prevX = pX;
      let prevY = this.zeroY;
      let prevY2 = this.zeroY;
      const lineYPosition = 0;
      const firstPrevY = this.lineHelpers.determineFirstPrevY({
        i,
        realIndex,
        series,
        prevY,
        lineYPosition,
        translationsIndex
      });
      prevY = firstPrevY.prevY;
      if (w2.config.stroke.curve === "monotoneCubic" && series[i][0] === null) {
        yArrj.push(null);
      } else {
        yArrj.push(prevY);
      }
      const pY = prevY;
      let firstPrevY2;
      if (type === "rangeArea") {
        firstPrevY2 = this.lineHelpers.determineFirstPrevY({
          i,
          realIndex,
          series: seriesRangeEnd,
          prevY: prevY2,
          lineYPosition,
          translationsIndex
        });
        prevY2 = firstPrevY2.prevY;
        pY2 = prevY2;
        y2Arrj.push(yArrj[0] !== null ? prevY2 : null);
      }
      const pathsFrom = this._calculatePathsFrom({
        type,
        series,
        i,
        realIndex,
        translationsIndex,
        prevX,
        prevY,
        prevY2
      });
      const rYArrj = [yArrj[0]];
      const rY2Arrj = [y2Arrj[0]];
      const iteratingOpts = {
        type,
        series,
        realIndex,
        translationsIndex,
        i,
        x,
        y,
        pX,
        pY,
        pathsFrom,
        linePaths,
        areaPaths,
        seriesIndex,
        lineYPosition,
        xArrj,
        yArrj,
        y2Arrj,
        seriesRangeEnd
      };
      const paths = this._iterateOverDataPoints(__spreadProps(__spreadValues({}, iteratingOpts), {
        iterations: type === "rangeArea" ? series[i].length - 1 : void 0,
        isRangeStart: true
      }));
      if (type === "rangeArea") {
        const pathsFrom2 = this._calculatePathsFrom({
          series: seriesRangeEnd,
          i,
          realIndex,
          prevX,
          prevY: prevY2
        });
        const rangePaths = this._iterateOverDataPoints(__spreadProps(__spreadValues({}, iteratingOpts), {
          series: seriesRangeEnd,
          xArrj: [x],
          yArrj: rYArrj,
          y2Arrj: rY2Arrj,
          pY: pY2,
          areaPaths: paths.areaPaths,
          pathsFrom: pathsFrom2,
          iterations: seriesRangeEnd[i].length - 1,
          isRangeStart: false
        }));
        const segments = paths.linePaths.length / 2;
        for (let s = 0; s < segments; s++) {
          paths.linePaths[s] = rangePaths.linePaths[s + segments] + paths.linePaths[s];
        }
        paths.linePaths.splice(segments);
        paths.pathFromLine = rangePaths.pathFromLine + paths.pathFromLine;
      } else if (!/z\s*$/i.test(paths.pathFromArea)) {
        paths.pathFromArea += "z";
      }
      this._handlePaths({ type, realIndex, i, paths });
      this.markers.flushBatch(this.elPointsMain, realIndex);
      this.elSeries.add(this.elPointsMain);
      this.elSeries.add(this.elDataLabelsWrap);
      allSeries.push(this.elSeries);
    }
    if (typeof /** @type {Record<string,any>} */
    ((_a = w2.config.series[0]) == null ? void 0 : _a.zIndex) !== "undefined") {
      allSeries.sort(
        (a, b2) => Number(a.node.getAttribute("zIndex")) - Number(b2.node.getAttribute("zIndex"))
      );
    }
    if (w2.config.chart.stacked) {
      for (let s = allSeries.length - 1; s >= 0; s--) {
        ret.add(allSeries[s]);
      }
    } else {
      for (let s = 0; s < allSeries.length; s++) {
        ret.add(allSeries[s]);
      }
    }
    return ret;
  }
  /**
   * @param {any[]} series
   * @param {number} i
   * @param {number} realIndex
   */
  _initSerieVariables(series, i, realIndex) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    this.xDivision = w2.layout.gridWidth / (w2.globals.dataPoints - (w2.config.xaxis.tickPlacement === "on" ? 1 : 0));
    this.strokeWidth = Array.isArray(w2.config.stroke.width) ? w2.config.stroke.width[realIndex] : w2.config.stroke.width;
    let translationsIndex = 0;
    if (this.yRatio.length > 1) {
      this.yaxisIndex = w2.globals.seriesYAxisReverseMap[realIndex];
      translationsIndex = realIndex;
    }
    this.isReversed = w2.config.yaxis[this.yaxisIndex] && w2.config.yaxis[this.yaxisIndex].reversed;
    this.zeroY = w2.layout.gridHeight - this.baseLineY[translationsIndex] - (this.isReversed ? w2.layout.gridHeight : 0) + (this.isReversed ? this.baseLineY[translationsIndex] * 2 : 0);
    this.areaBottomY = this.zeroY;
    if (this.zeroY > w2.layout.gridHeight || w2.config.plotOptions.area.fillTo === "end") {
      this.areaBottomY = w2.layout.gridHeight;
    }
    this.categoryAxisCorrection = this.xDivision / 2;
    const seriesItem = (
      /** @type {Record<string,any>} */
      w2.config.series[realIndex]
    );
    this.elSeries = graphics.group({
      class: `apexcharts-series`,
      zIndex: typeof seriesItem.zIndex !== "undefined" ? seriesItem.zIndex : realIndex,
      seriesName: Utils.escapeString(w2.seriesData.seriesNames[realIndex])
    });
    this.elPointsMain = graphics.group({
      class: "apexcharts-series-markers-wrap",
      "data:realIndex": realIndex
    });
    this.markers.resetSeriesWrapCache();
    this._elLastPointsWrap = null;
    if (w2.globals.hasNullValues) {
      const firstPoint = this.markers.plotChartMarkers({
        pointsPos: {
          x: [0],
          y: [w2.layout.gridHeight + w2.globals.markers.largestSize]
        },
        seriesIndex: i,
        j: 0,
        pSize: 0.1,
        alwaysDrawMarker: true,
        isVirtualPoint: true
      });
      if (firstPoint !== null) {
        this.elPointsMain.add(firstPoint);
      }
    }
    this.elDataLabelsWrap = graphics.group({
      class: "apexcharts-datalabels",
      "data:realIndex": realIndex
    });
    const longestSeries = series[i].length === w2.globals.dataPoints;
    this.elSeries.attr({
      "data:longestSeries": longestSeries,
      rel: i + 1,
      "data:realIndex": realIndex
    });
    this.appendPathFrom = true;
  }
  /** @param {{ type?: any, series?: any, i?: any, realIndex?: any, translationsIndex?: any, prevX?: any, prevY?: any, prevY2?: any }} opts */
  _calculatePathsFrom({
    type,
    series,
    i,
    realIndex,
    translationsIndex,
    prevX,
    prevY,
    prevY2
  }) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    let linePath, areaPath, pathFromLine, pathFromArea;
    if (series[i][0] === null) {
      for (let s = 0; s < series[i].length; s++) {
        if (series[i][s] !== null) {
          prevX = this.xDivision * s;
          prevY = this.zeroY - series[i][s] / this.yRatio[translationsIndex];
          linePath = graphics.move(prevX, prevY);
          areaPath = graphics.move(prevX, this.areaBottomY);
          break;
        }
      }
    } else {
      linePath = graphics.move(prevX, prevY);
      if (type === "rangeArea") {
        linePath = graphics.move(prevX, prevY2) + graphics.line(prevX, prevY);
      }
      areaPath = graphics.move(prevX, this.areaBottomY) + graphics.line(prevX, prevY);
    }
    pathFromLine = graphics.move(0, this.areaBottomY) + graphics.line(0, this.areaBottomY);
    pathFromArea = graphics.move(0, this.areaBottomY) + graphics.line(0, this.areaBottomY);
    if (w2.globals.previousPaths.length > 0) {
      const pathFrom = this.lineHelpers.checkPreviousPaths({
        pathFromLine,
        pathFromArea,
        realIndex
      });
      pathFromLine = pathFrom.pathFromLine;
      pathFromArea = pathFrom.pathFromArea;
    }
    return {
      prevX,
      prevY,
      linePath,
      areaPath,
      pathFromLine,
      pathFromArea
    };
  }
  /**
   * The identity a stacked baseline is looked up by.
   *
   * On a numeric or datetime axis each series carries its own x array, and two
   * series' Nth points are not the same x when one of them is missing an entry.
   * So the key is the x VALUE there. On a category axis every series is indexed
   * against the shared category list, so the ordinal already IS the identity
   * (and the pixel x is a running sum, unsafe to compare as a float).
   *
   * Returns undefined when this ordinal has no x, which happens on every series
   * shorter than the longest one: the loop runs `dataPoints - 1` times for all
   * of them. Those iterations must not write to or read from the map.
   * @param {number} realIndex
   * @param {number} ordinal
   * @returns {any}
   */
  _stackKey(realIndex, ordinal) {
    if (!this.w.axisFlags.isXNumeric) return ordinal;
    const xs = this.w.seriesData.seriesX[realIndex];
    return xs ? xs[ordinal] : void 0;
  }
  /**
   * Pixel y of the top of the stack at one point of the series being drawn, or
   * undefined when nothing has been stacked there yet (so the caller starts
   * from the axis baseline).
   * @param {number} realIndex
   * @param {number} ordinal
   * @returns {number | undefined}
   */
  stackTopAt(realIndex, ordinal) {
    const key = this._stackKey(realIndex, ordinal);
    if (key === void 0 || key === null) return void 0;
    return this.prevSeriesYByX.get(key);
  }
  /**
   * Fold a drawn series into the running stack top, so the next series can find
   * its baseline by x (#4886).
   *
   * A point the series does not have simply leaves the previous top in place,
   * which is the same thing as contributing 0 there. That is exactly what the
   * workaround posted on the issue does by hand (pad every series onto the union
   * of all x with zeros), and it is the behaviour the reporter expected.
   *
   * Collapsed series are skipped rather than folded in. Today a collapsed series
   * renders a full-length yArrj sitting on the running baseline, so folding it
   * would be a no-op anyway, but skipping states the intent and keeps this
   * correct if that representation ever changes.
   * @param {number} realIndex
   * @param {any[]} yArrj
   */
  _recordStackTops(realIndex, yArrj) {
    const w2 = this.w;
    if (!Array.isArray(yArrj)) return;
    if (w2.globals.collapsedSeriesIndices.indexOf(realIndex) !== -1 || w2.globals.ancillaryCollapsedSeriesIndices.indexOf(realIndex) !== -1) {
      return;
    }
    for (let j = 0; j < yArrj.length; j++) {
      const key = this._stackKey(realIndex, j);
      if (key === void 0 || key === null) continue;
      const y = yArrj[j];
      if (!Utils.isNumber(y)) continue;
      this.prevSeriesYByX.set(key, y);
    }
  }
  /** @param {{type: any, realIndex: any, i: any, paths: any}} opts */
  _handlePaths({ type, realIndex, i, paths }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const emit = seriesEmitter(this.ctx, graphics);
    const fill = new Fill(this.w);
    this.prevSeriesY.push(paths.yArrj);
    this._recordStackTops(realIndex, paths.yArrj);
    let streamScroll = null;
    if ((type === "line" || type === "area") && w2.globals.dataChanged) {
      streamScroll = detectStreamScroll(w2, realIndex, paths.xArrj, paths.yArrj);
    }
    let reconcile = null;
    if (!streamScroll && (type === "line" || type === "area")) {
      reconcile = reconcileSeriesPaths(w2, {
        type,
        realIndex,
        pathFromLine: paths.pathFromLine,
        pathFromArea: paths.pathFromArea,
        linePaths: paths.linePaths,
        areaPaths: paths.areaPaths
      });
    }
    w2.globals.seriesXvalues[realIndex] = paths.xArrj;
    w2.globals.seriesYvalues[realIndex] = paths.yArrj;
    const forecast = w2.config.forecastDataPoints;
    if (forecast.count > 0 && type !== "rangeArea") {
      const forecastCutoff = w2.globals.seriesXvalues[realIndex][w2.globals.seriesXvalues[realIndex].length - forecast.count - 1];
      const elForecastMask = graphics.drawRect(
        forecastCutoff,
        0,
        w2.layout.gridWidth,
        w2.layout.gridHeight,
        0
      );
      w2.dom.elForecastMask.appendChild(elForecastMask.node);
      const elNonForecastMask = graphics.drawRect(
        0,
        0,
        forecastCutoff,
        w2.layout.gridHeight,
        0
      );
      w2.dom.elNonForecastMask.appendChild(elNonForecastMask.node);
    }
    if (!this.pointsChart) {
      w2.globals.delayedElements.push({
        el: this.elPointsMain.node,
        index: realIndex
      });
      tweenSeriesMarkers(w2, {
        elPointsMain: this.elPointsMain,
        realIndex,
        speed: w2.config.chart.animations.dynamicAnimation.speed
      });
      if (seriesJoin(w2, realIndex) && ((_a = this.elDataLabelsWrap) == null ? void 0 : _a.node)) {
        this.elDataLabelsWrap.node.classList.add("apexcharts-element-hidden");
        w2.globals.delayedElements.push({
          el: this.elDataLabelsWrap.node,
          holdUntilComplete: true
        });
      }
    } else {
      tweenSeriesMarkers(w2, {
        elPointsMain: this.elPointsMain,
        realIndex,
        speed: w2.config.chart.animations.dynamicAnimation.speed
      });
    }
    const defaultRenderedPathOptions = {
      i,
      realIndex,
      animationDelay: i,
      initialSpeed: w2.config.chart.animations.speed,
      dataChangeSpeed: w2.config.chart.animations.dynamicAnimation.speed,
      className: `apexcharts-${type}`
    };
    const numericXY = paths.numericXY;
    const mergeSegments = type === "line" || type === "area";
    const linePathsToDraw = mergeSegments && paths.linePaths.length > 1 ? [paths.linePaths.join(" ")] : paths.linePaths;
    const areaPathsToDraw = mergeSegments && paths.areaPaths.length > 1 ? [paths.areaPaths.join(" ")] : paths.areaPaths;
    if (type === "area") {
      const pathFill = fill.fillPath({
        seriesNumber: realIndex
      });
      for (let p2 = 0; p2 < areaPathsToDraw.length; p2++) {
        const renderedPath = emit.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: streamScroll ? projectPathToPrevFrame(paths.areaPaths[p2], streamScroll) : (_c = (_b = reconcile == null ? void 0 : reconcile.area) == null ? void 0 : _b.from) != null ? _c : paths.pathFromArea,
          pathTo: areaPathsToDraw[p2],
          pathToNumeric: numericXY ? {
            xs: numericXY.xs,
            ys: numericXY.ys,
            closeY: numericXY.areaCloseY
          } : void 0,
          pathToInterp: (_d = reconcile == null ? void 0 : reconcile.area) == null ? void 0 : _d.toInterp,
          scrollMorph: !!streamScroll,
          stroke: "none",
          strokeWidth: 0,
          strokeLineCap: null,
          fill: pathFill
        }));
        this.elSeries.add(renderedPath);
      }
    }
    if (w2.config.stroke.show && !this.pointsChart) {
      let lineFill = null;
      if (type === "line") {
        lineFill = fill.fillPath({
          seriesNumber: realIndex,
          i
        });
      } else {
        if (w2.config.stroke.fill.type === "solid") {
          lineFill = w2.globals.stroke.colors[realIndex];
        } else {
          const prevFill = w2.config.fill;
          w2.config.fill = w2.config.stroke.fill;
          lineFill = fill.fillPath({
            seriesNumber: realIndex,
            i
          });
          w2.config.fill = prevFill;
        }
      }
      for (let p2 = 0; p2 < linePathsToDraw.length; p2++) {
        let pathFill = lineFill;
        if (type === "rangeArea") {
          pathFill = fill.fillPath({
            seriesNumber: realIndex
          });
        }
        const linePathCommonOpts = __spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: streamScroll ? projectPathToPrevFrame(paths.linePaths[p2], streamScroll) : (_f = (_e = reconcile == null ? void 0 : reconcile.line) == null ? void 0 : _e.from) != null ? _f : paths.pathFromLine,
          pathTo: linePathsToDraw[p2],
          pathToNumeric: numericXY ? { xs: numericXY.xs, ys: numericXY.ys } : void 0,
          pathToInterp: (_g = reconcile == null ? void 0 : reconcile.line) == null ? void 0 : _g.toInterp,
          scrollMorph: !!streamScroll,
          stroke: lineFill,
          strokeWidth: this.strokeWidth,
          strokeLineCap: w2.config.stroke.lineCap,
          fill: type === "rangeArea" ? pathFill : "none"
        });
        const renderedPath = emit.renderPaths(linePathCommonOpts);
        this.elSeries.add(renderedPath);
        renderedPath.attr("fill-rule", `evenodd`);
        if (forecast.count > 0 && type !== "rangeArea") {
          const renderedForecastPath = emit.renderPaths(linePathCommonOpts);
          renderedForecastPath.node.setAttribute(
            "stroke-dasharray",
            forecast.dashArray
          );
          if (forecast.strokeWidth) {
            renderedForecastPath.node.setAttribute(
              "stroke-width",
              forecast.strokeWidth
            );
          }
          this.elSeries.add(renderedForecastPath);
          renderedForecastPath.attr(
            "clip-path",
            `url(#forecastMask${w2.globals.cuid})`
          );
          renderedPath.attr(
            "clip-path",
            `url(#nonForecastMask${w2.globals.cuid})`
          );
        }
      }
    }
  }
  _iterateOverDataPoints({
    type,
    series,
    iterations,
    realIndex,
    translationsIndex,
    i,
    x,
    y,
    pX,
    pY,
    pathsFrom,
    linePaths,
    areaPaths,
    seriesIndex,
    lineYPosition,
    xArrj,
    yArrj,
    y2Arrj,
    isRangeStart,
    seriesRangeEnd
  }) {
    var _a, _b;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const yRatio = this.yRatio;
    let { prevY, linePath, areaPath, pathFromLine, pathFromArea } = pathsFrom;
    const minY = Utils.isNumber(w2.globals.minYArr[realIndex]) ? w2.globals.minYArr[realIndex] : w2.globals.minY;
    if (!iterations) {
      iterations = w2.globals.dataPoints > 1 ? w2.globals.dataPoints - 1 : w2.globals.dataPoints;
    }
    const getY = (_y, lineYPos) => {
      return lineYPos - _y / yRatio[translationsIndex] + (this.isReversed ? _y / yRatio[translationsIndex] : 0) * 2;
    };
    let y2 = y;
    const stackSeries = w2.config.chart.stacked && !w2.globals.comboCharts || w2.config.chart.stacked && w2.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || /** @type {Record<string,any>} */
    ((_a = this.w.config.series[realIndex]) == null ? void 0 : _a.type) === "bar" || /** @type {Record<string,any>} */
    ((_b = this.w.config.series[realIndex]) == null ? void 0 : _b.type) === "column");
    let curve = w2.config.stroke.curve;
    if (Array.isArray(curve)) {
      if (Array.isArray(seriesIndex)) {
        curve = curve[seriesIndex[i]];
      } else {
        curve = curve[i];
      }
    }
    let pathState = 0;
    let segmentStartX;
    const jitterPx = this.pointsChart ? this._scatterJitterPx(realIndex) : null;
    if (curve === "straight" && !this.pointsChart) {
      const fast = this._fastStraightPath({
        type,
        series,
        i,
        realIndex,
        translationsIndex,
        iterations,
        x,
        y,
        pX,
        pY,
        pathsFrom,
        linePaths,
        areaPaths,
        xArrj,
        yArrj,
        y2Arrj,
        stackSeries
      });
      if (fast) return fast;
    }
    for (let j = 0; j < iterations; j++) {
      if (series[i].length === 0) break;
      const isNull = typeof series[i][j + 1] === "undefined" || series[i][j + 1] === null;
      if (w2.axisFlags.isXNumeric) {
        let sX = w2.seriesData.seriesX[realIndex][j + 1];
        if (typeof w2.seriesData.seriesX[realIndex][j + 1] === "undefined") {
          sX = w2.seriesData.seriesX[realIndex][iterations - 1];
        }
        x = (sX - w2.globals.minX) / this.xRatio;
      } else {
        x = x + this.xDivision;
      }
      if (stackSeries) {
        if (i > 0 && w2.globals.collapsedSeries.length < w2.config.series.length - 1) {
          const prevIndex = (pi) => {
            var _a2;
            for (let pii = pi; pii >= 0; pii--) {
              const ri = (_a2 = seriesIndex == null ? void 0 : seriesIndex[pii]) != null ? _a2 : pii;
              if (w2.globals.collapsedSeriesIndices.indexOf(ri) === -1 && w2.globals.ancillaryCollapsedSeriesIndices.indexOf(ri) === -1) {
                return pii;
              }
            }
            return -1;
          };
          const pIdx = prevIndex(i - 1);
          if (pIdx < 0) {
            lineYPosition = this.zeroY;
          } else {
            const top = this.stackTopAt(realIndex, j + 1);
            lineYPosition = top === void 0 ? this.zeroY : top;
          }
        } else {
          lineYPosition = this.zeroY;
        }
      } else {
        lineYPosition = this.zeroY;
      }
      if (isNull) {
        y = getY(minY, lineYPosition);
      } else {
        y = getY(series[i][j + 1], lineYPosition);
        if (type === "rangeArea") {
          y2 = getY(seriesRangeEnd[i][j + 1], lineYPosition);
        }
      }
      let xj = x;
      let yj = y;
      if (jitterPx) {
        const seed = realIndex * 100003 + (j + 1);
        if (jitterPx.x) xj = x + (hash01(seed * 7919 + 13) - 0.5) * 2 * jitterPx.x;
        if (jitterPx.y) yj = y + (hash01(seed * 6271 + 97) - 0.5) * 2 * jitterPx.y;
      }
      xArrj.push(series[i][j + 1] === null ? null : xj);
      if (isNull && (w2.config.stroke.curve === "smooth" || w2.config.stroke.curve === "monotoneCubic")) {
        yArrj.push(null);
        y2Arrj.push(null);
      } else {
        yArrj.push(yj);
        y2Arrj.push(y2);
      }
      const pointsPos = this.lineHelpers.calculatePoints({
        series,
        x: xj,
        y: yj,
        realIndex,
        i,
        j,
        prevY
      });
      const calculatedPaths = this._createPaths({
        type,
        series,
        i,
        j,
        x,
        y,
        y2,
        xArrj,
        yArrj,
        y2Arrj,
        pX,
        pY,
        pathState,
        segmentStartX,
        linePath,
        areaPath,
        linePaths,
        areaPaths,
        curve,
        isRangeStart
      });
      areaPaths = calculatedPaths.areaPaths;
      linePaths = calculatedPaths.linePaths;
      pX = calculatedPaths.pX;
      pY = calculatedPaths.pY;
      pathState = calculatedPaths.pathState;
      segmentStartX = calculatedPaths.segmentStartX;
      areaPath = calculatedPaths.areaPath;
      linePath = calculatedPaths.linePath;
      if (this.appendPathFrom && !w2.globals.hasNullValues && !(curve === "monotoneCubic" && type === "rangeArea")) {
        pathFromLine += graphics.line(x, this.areaBottomY);
        pathFromArea += graphics.line(x, this.areaBottomY);
      }
      this.handleNullDataPoints(series, pointsPos, i, j, realIndex);
      this._handleMarkersAndLabels({
        type,
        pointsPos,
        i,
        j,
        realIndex,
        isRangeStart
      });
    }
    return {
      yArrj,
      xArrj,
      pathFromArea,
      areaPaths,
      pathFromLine,
      linePaths,
      linePath,
      areaPath
    };
  }
  /** @param {{type: any, pointsPos: any, isRangeStart: any, i: any, j: any, realIndex: any}} opts */
  _handleMarkersAndLabels({ type, pointsPos, isRangeStart, i, j, realIndex }) {
    const w2 = this.w;
    const dataLabels = new DataLabels(this.w, this.ctx);
    if (!this.pointsChart) {
      const useProgressive = !w2.globals.dataChanged && !w2.globals.resized && !w2.globals.markers.batched;
      if (!useProgressive && w2.seriesData.series[i].length > 1) {
        this.elPointsMain.node.classList.add("apexcharts-element-hidden");
      }
      const elPointsWrap = this.markers.plotChartMarkers({
        pointsPos,
        seriesIndex: realIndex,
        j: j + 1
      });
      if (elPointsWrap !== null && elPointsWrap !== this._elLastPointsWrap) {
        this.elPointsMain.add(elPointsWrap);
        this._elLastPointsWrap = elPointsWrap;
      }
    } else {
      this.scatter.draw(this.elSeries, j, {
        realIndex,
        pointsPos,
        zRatio: this.zRatio,
        elParent: this.elPointsMain
      });
    }
    const drawnLabels = dataLabels.drawDataLabel({
      type,
      isRangeStart,
      pos: pointsPos,
      i: realIndex,
      j: j + 1
    });
    if (drawnLabels !== null) {
      this.elDataLabelsWrap.add(drawnLabels);
    }
  }
  /**
   * Max scatter-jitter offsets in pixels for this series, or null when jitter is
   * off. The config offsets are in axis units (x: 1 = one category step / x-data
   * unit, y: 1 = one y-data unit); convert each to pixels using the chart's
   * ratios. The actual per-point offset is a deterministic fraction of these
   * (see Scatter.drawPoint).
   * @param {number} realIndex
   * @returns {{ x: number, y: number } | null}
   */
  _scatterJitterPx(realIndex) {
    var _a;
    const w2 = this.w;
    const jt = (_a = w2.config.plotOptions.scatter) == null ? void 0 : _a.jitter;
    if (!jt || !jt.enabled || !jt.x && !jt.y) return null;
    const xUnitPx = w2.axisFlags.isXNumeric && this.xRatio ? 1 / this.xRatio : this.xDivision;
    const ti = this.yRatio.length > 1 ? realIndex : 0;
    const yUnitPx = this.yRatio[ti] ? 1 / this.yRatio[ti] : 0;
    return {
      x: (jt.x || 0) * xUnitPx,
      y: (jt.y || 0) * yUnitPx
    };
  }
  /**
   * Numeric geometry fast path for plain straight line/area series (the
   * render-2026 perf work). Eligibility is strict: everything the per-point
   * slow loop can do beyond plain geometry (null gaps, markers, data labels,
   * discrete markers, stacking, combos, range areas) bails to the state
   * machine. When eligible it produces the SAME outputs as the slow loop
   * (byte-identical d strings via join, the same xArrj/yArrj/y2Arrj
   * pushes, and the same pointsArray tooltip cache) in one tight loop.
   * In canvas mode it additionally emits typed-array coordinates so the
   * renderer can paint via moveTo/lineTo without a Path2D d-string parse.
   *
   * @param {{type: any, series: any, i: number, realIndex: number,
   *   translationsIndex: number, iterations: number, x: number, y: number,
   *   pX: number, pY: number, pathsFrom: any, linePaths: any[],
   *   areaPaths: any[], xArrj: any[], yArrj: any[], y2Arrj: any[],
   *   stackSeries: boolean}} opts
   * @returns {any} the _iterateOverDataPoints result, or null when ineligible
   */
  _fastStraightPath({
    type,
    series,
    i,
    realIndex,
    translationsIndex,
    iterations,
    x,
    y,
    pX,
    pY,
    pathsFrom,
    linePaths,
    areaPaths,
    xArrj,
    yArrj,
    y2Arrj,
    stackSeries
  }) {
    const w2 = this.w;
    if (type !== "line" && type !== "area") return null;
    if (w2.globals.comboCharts || stackSeries) return null;
    if (w2.config.dataLabels.enabled) return null;
    if (w2.config.markers.discrete.length) return null;
    if (w2.globals.markers.size[realIndex] > 0) return null;
    const s = series[i];
    const n = s.length;
    if (!iterations || n < 2 || n - 1 !== iterations) return null;
    for (let k = 0; k <= iterations; k++) {
      const v2 = s[k];
      if (v2 === null || typeof v2 === "undefined") return null;
    }
    const isXNumeric = w2.axisFlags.isXNumeric;
    const sx = isXNumeric ? w2.seriesData.seriesX[realIndex] : null;
    if (isXNumeric && (!sx || sx.length < n)) return null;
    const yR = this.yRatio[translationsIndex];
    const isReversed = this.isReversed;
    const zeroY = this.zeroY;
    const bottomY = this.areaBottomY;
    const xRatio = this.xRatio;
    const minX = w2.globals.minX;
    const xDivision = this.xDivision;
    const offX = w2.config.markers.offsetX;
    const offY = w2.config.markers.offsetY;
    const appendFrom = this.appendPathFrom && !w2.globals.hasNullValues;
    let { pathFromLine, pathFromArea } = pathsFrom;
    const r = this.ctx && this.ctx.renderer;
    const canvasMode = !!(r && r.kind && r.kind !== "svg");
    const buildStrings = !canvasMode || w2.globals.dataChanged && !!w2.globals.prevStreamFrame;
    const nxs = canvasMode ? new Float64Array(n) : null;
    const nys = canvasMode ? new Float64Array(n) : null;
    if (nxs && nys) {
      nxs[0] = pX;
      nys[0] = pY;
    }
    if (typeof w2.globals.pointsArray[realIndex] === "undefined") {
      w2.globals.pointsArray[realIndex] = [];
    }
    const pts = w2.globals.pointsArray[realIndex];
    const xPT1st = sx ? (sx[0] - minX) / xRatio + offX : this.categoryAxisCorrection + offX;
    pts.push([xPT1st, pathsFrom.prevY + offY]);
    const parts = buildStrings ? new Array(iterations + 1) : [];
    if (buildStrings) parts[0] = "M " + pX + " " + pY;
    const fromParts = buildStrings && appendFrom ? new Array(iterations) : null;
    let xv = x;
    let xj = pX;
    let yj = pY;
    for (let j = 0; j < iterations; j++) {
      if (sx) {
        xj = (sx[j + 1] - minX) / xRatio;
      } else {
        xv = xv + xDivision;
        xj = xv;
      }
      const v2 = s[j + 1];
      yj = zeroY - v2 / yR + (isReversed ? v2 / yR : 0) * 2;
      xArrj.push(xj);
      yArrj.push(yj);
      y2Arrj.push(y);
      pts.push([xj + offX, yj + offY]);
      if (buildStrings) {
        parts[j + 1] = " L " + xj + " " + yj;
        if (fromParts) fromParts[j] = " L " + xj + " " + bottomY;
      }
      if (nxs && nys) {
        nxs[j + 1] = xj;
        nys[j + 1] = yj;
      }
    }
    let linePath = "";
    let areaPath = "";
    if (buildStrings) {
      linePath = parts.join("");
      areaPath = linePath + " L " + xj + " " + bottomY + " L " + pX + " " + bottomY + "z";
    }
    if (fromParts) {
      const fromAppend = fromParts.join("");
      pathFromLine += fromAppend;
      pathFromArea += fromAppend;
    } else if (!buildStrings && appendFrom) {
      pathFromLine += " L " + xj + " " + bottomY;
      pathFromArea += " L " + xj + " " + bottomY;
    }
    linePaths.push(linePath);
    areaPaths.push(areaPath);
    return {
      yArrj,
      xArrj,
      pathFromArea,
      areaPaths,
      pathFromLine,
      linePaths,
      linePath,
      areaPath,
      numericXY: nxs ? { xs: nxs, ys: nys, areaCloseY: bottomY } : void 0
    };
  }
  /** @param {{type: any, series: any, i: any, j: any, x: any, y: any, xArrj: any, yArrj: any, y2: any, y2Arrj: any, pX: any, pY: any, pathState: any, segmentStartX: any, linePath: any, areaPath: any, linePaths: any, areaPaths: any, curve: any, isRangeStart: any}} opts */
  _createPaths({
    type,
    series,
    i,
    j,
    x,
    y,
    xArrj,
    yArrj,
    y2,
    y2Arrj,
    pX,
    pY,
    pathState,
    segmentStartX,
    linePath,
    areaPath,
    linePaths,
    areaPaths,
    curve,
    isRangeStart
  }) {
    const graphics = new Graphics(this.w);
    const areaBottomY = this.areaBottomY;
    const rangeArea = type === "rangeArea";
    const isLowerRangeAreaPath = type === "rangeArea" && isRangeStart;
    switch (curve) {
      case "monotoneCubic": {
        const yAj = isRangeStart ? yArrj : y2Arrj;
        const getSmoothInputs = (xArr, yArr) => {
          return xArr.map((_, i2) => {
            return [_, yArr[i2]];
          }).filter((_) => _[1] !== null);
        };
        const getSegmentLengths = (yArr) => {
          const segLens = [];
          let count = 0;
          yArr.forEach((_) => {
            if (_ !== null) {
              count++;
            } else if (count > 0) {
              segLens.push(count);
              count = 0;
            }
          });
          if (count > 0) {
            segLens.push(count);
          }
          return segLens;
        };
        const getSegments = (yArr, points) => {
          const segLens = getSegmentLengths(yArr);
          const segments = [];
          for (let i2 = 0, len = 0; i2 < segLens.length; len += segLens[i2++]) {
            segments[i2] = spline.slice(points, len, len + segLens[i2]);
          }
          return segments;
        };
        switch (pathState) {
          case 0:
            if (yAj[j + 1] === null) {
              break;
            }
            pathState = 1;
          // falls through
          case 1:
            if (!(rangeArea ? xArrj.length === series[i].length : j === series[i].length - 2)) {
              break;
            }
          // falls through
          case 2: {
            const _xAj = isRangeStart ? xArrj : xArrj.slice().reverse();
            const _yAj = isRangeStart ? yAj : yAj.slice().reverse();
            const smoothInputs = getSmoothInputs(_xAj, _yAj);
            const points = smoothInputs.length > 1 ? spline.points(smoothInputs) : smoothInputs;
            let smoothInputsLower = [];
            if (rangeArea) {
              if (isLowerRangeAreaPath) {
                areaPaths = smoothInputs;
              } else {
                smoothInputsLower = areaPaths.reverse();
              }
            }
            let segmentCount = 0;
            let smoothInputsIndex = 0;
            getSegments(_yAj, points).forEach((_) => {
              segmentCount++;
              const svgPoints = svgPath(_);
              const _start = smoothInputsIndex;
              smoothInputsIndex += _.length;
              const _end = smoothInputsIndex - 1;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints;
              } else if (rangeArea) {
                linePath = graphics.move(
                  smoothInputsLower[_start][0],
                  smoothInputsLower[_start][1]
                ) + graphics.line(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints + graphics.line(
                  smoothInputsLower[_end][0],
                  smoothInputsLower[_end][1]
                );
              } else {
                linePath = graphics.move(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints;
                areaPath = linePath + graphics.line(smoothInputs[_end][0], areaBottomY) + graphics.line(smoothInputs[_start][0], areaBottomY) + "z";
                areaPaths.push(areaPath);
              }
              linePaths.push(linePath);
            });
            if (rangeArea && segmentCount > 1 && !isLowerRangeAreaPath) {
              const upperLinePaths = linePaths.slice(segmentCount).reverse();
              linePaths.splice(segmentCount);
              upperLinePaths.forEach(
                (u) => linePaths.push(u)
              );
            }
            pathState = 0;
            break;
          }
        }
        break;
      }
      case "smooth": {
        const length = (x - pX) * 0.35;
        if (series[i][j] === null) {
          pathState = 0;
        } else {
          switch (pathState) {
            case 0:
              segmentStartX = pX;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(pX, y2Arrj[j]) + graphics.line(pX, pY);
              } else {
                linePath = graphics.move(pX, pY);
              }
              areaPath = graphics.move(pX, pY);
              if (series[i][j + 1] === null || typeof series[i][j + 1] === "undefined") {
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                break;
              }
              pathState = 1;
              if (j < series[i].length - 2) {
                const p2 = graphics.curve(pX + length, pY, x - length, y, x, y);
                linePath += p2;
                areaPath += p2;
                break;
              }
            // falls through
            case 1:
              if (series[i][j + 1] === null) {
                if (isLowerRangeAreaPath) {
                  linePath += graphics.line(pX, y2);
                } else {
                  linePath += graphics.move(pX, pY);
                }
                areaPath += graphics.line(pX, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                pathState = -1;
              } else {
                const p2 = graphics.curve(pX + length, pY, x - length, y, x, y);
                linePath += p2;
                areaPath += p2;
                if (j >= series[i].length - 2) {
                  if (isLowerRangeAreaPath) {
                    linePath += graphics.curve(x, y, x, y, x, y2) + graphics.move(x, y2);
                  }
                  areaPath += graphics.curve(x, y, x, y, x, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                  linePaths.push(linePath);
                  areaPaths.push(areaPath);
                  pathState = -1;
                }
              }
              break;
          }
        }
        pX = x;
        pY = y;
        break;
      }
      default: {
        const pathToPoint = (curve2, x2, y3) => {
          let path = "";
          switch (curve2) {
            case "stepline":
              path = graphics.line(x2, null, "H") + graphics.line(null, y3, "V");
              break;
            case "linestep":
              path = graphics.line(null, y3, "V") + graphics.line(x2, null, "H");
              break;
            case "straight":
              path = graphics.line(x2, y3);
              break;
          }
          return path;
        };
        if (series[i][j] === null) {
          pathState = 0;
        } else {
          switch (pathState) {
            case 0:
              segmentStartX = pX;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(pX, y2Arrj[j]) + graphics.line(pX, pY);
              } else {
                linePath = graphics.move(pX, pY);
              }
              areaPath = graphics.move(pX, pY);
              if (series[i][j + 1] === null || typeof series[i][j + 1] === "undefined") {
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                break;
              }
              pathState = 1;
              if (j < series[i].length - 2) {
                const p2 = pathToPoint(curve, x, y);
                linePath += p2;
                areaPath += p2;
                break;
              }
            // falls through
            case 1:
              if (series[i][j + 1] === null) {
                if (isLowerRangeAreaPath) {
                  linePath += graphics.line(pX, y2);
                } else {
                  linePath += graphics.move(pX, pY);
                }
                areaPath += graphics.line(pX, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                pathState = -1;
              } else {
                const p2 = pathToPoint(curve, x, y);
                linePath += p2;
                areaPath += p2;
                if (j >= series[i].length - 2) {
                  if (isLowerRangeAreaPath) {
                    linePath += graphics.line(x, y2);
                  }
                  areaPath += graphics.line(x, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                  linePaths.push(linePath);
                  areaPaths.push(areaPath);
                  pathState = -1;
                }
              }
              break;
          }
        }
        pX = x;
        pY = y;
        break;
      }
    }
    return {
      linePaths,
      areaPaths,
      pX,
      pY,
      pathState,
      segmentStartX,
      linePath,
      areaPath
    };
  }
  /**
   * @param {any[]} series
   * @param {any} pointsPos
   * @param {number} i
   * @param {number} j
   * @param {number} realIndex
   */
  handleNullDataPoints(series, pointsPos, i, j, realIndex) {
    const w2 = this.w;
    if (series[i][j] === null && w2.config.markers.showNullDataPoints || series[i].length === 1) {
      let pSize = this.strokeWidth - w2.config.markers.strokeWidth / 2;
      if (!(pSize > 0)) {
        pSize = 0;
      }
      const elPointsWrap = this.markers.plotChartMarkers({
        pointsPos,
        seriesIndex: realIndex,
        j: j + 1,
        pSize,
        alwaysDrawMarker: true
      });
      if (elPointsWrap !== null) {
        this.elPointsMain.add(elPointsWrap);
      }
    }
  }
}
function drawOuterLabel(w2, spec) {
  const {
    lines,
    lineHeight,
    anchor,
    elbow,
    labelX,
    labelY,
    side,
    connector,
    style,
    foreColor
  } = spec;
  const graphics = new Graphics(w2);
  const group = graphics.group({
    class: spec.groupClass || "apexcharts-outer-label-group"
  });
  if (connector.show) {
    const d = `M ${anchor.x} ${anchor.y} L ${elbow.x} ${elbow.y} L ${labelX} ${labelY}`;
    const line = graphics.drawPath({
      d,
      stroke: connector.color,
      strokeWidth: connector.width,
      fill: "none",
      strokeLinecap: "round"
    });
    line.node.classList.add(spec.connectorClass || "apexcharts-outer-label-connector");
    group.add(line);
  }
  const textX = side === "right" ? labelX + 4 : labelX - 4;
  const n = lines.length;
  const startY = labelY - (n - 1) * lineHeight / 2;
  const elText = graphics.drawText({
    x: textX,
    y: startY,
    text: n === 1 ? lines[0] : lines,
    textAnchor: side === "right" ? "start" : "end",
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    foreColor,
    dominantBaseline: "central",
    cssClass: spec.textClass || "apexcharts-outer-label"
  });
  if (n > 1) {
    const tspans = elText.node.getElementsByTagName("tspan");
    for (let li = 0; li < tspans.length; li++) {
      tspans[li].setAttribute("x", `${textX}`);
      tspans[li].setAttribute("dy", li === 0 ? "0" : `${lineHeight}`);
    }
  }
  group.add(elText);
  return group;
}
function measureLabelWidth(w2, labels, style = {}) {
  const graphics = new Graphics(w2);
  const fontSize = style.fontSize || "12px";
  const px = parseFloat(fontSize) || 12;
  let max = 0;
  labels.forEach((text) => {
    if (text == null || text === "") return;
    const str = `${text}`;
    const measured = graphics.getTextRects(str, fontSize, style.fontFamily, "").width;
    max = Math.max(max, measured > 0 ? measured : str.length * px * 0.58);
  });
  return max;
}
function spaceOutLabels(items, minGap, maxY, minY) {
  const col = items.slice().sort((a, b2) => a.idealY - b2.idealY);
  col.forEach((l) => {
    l.labelY = l.idealY;
  });
  for (let k = 1; k < col.length; k++) {
    if (col[k].labelY - col[k - 1].labelY < minGap) {
      col[k].labelY = col[k - 1].labelY + minGap;
    }
  }
  const last = col[col.length - 1];
  const overflow = last ? last.labelY - maxY : 0;
  if (overflow > 0) {
    for (let k = col.length - 1; k >= 0; k--) {
      col[k].labelY -= overflow;
      if (k < col.length - 1 && col[k + 1].labelY - col[k].labelY < minGap) {
        col[k].labelY = col[k + 1].labelY - minGap;
      }
    }
  }
  if (minY != null && col.length && col[0].labelY < minY) {
    const shift = minY - col[0].labelY;
    for (let k = 0; k < col.length; k++) {
      col[k].labelY += shift;
    }
  }
}
class CircularChartsHelpers {
  /**
   * @param {import('../../../types/internal').ChartStateW} w
   */
  constructor(w2) {
    this.w = w2;
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} i
   * @param {string | number} text
   */
  drawYAxisTexts(x, y, i, text) {
    const w2 = this.w;
    const yaxisConfig = w2.config.yaxis[0];
    const formatter = w2.formatters.yLabelFormatters[0];
    const graphics = new Graphics(this.w);
    const yaxisLabel = graphics.drawText({
      x: x + yaxisConfig.labels.offsetX,
      y: y + yaxisConfig.labels.offsetY,
      text: formatter(text, i),
      textAnchor: "middle",
      fontSize: yaxisConfig.labels.style.fontSize,
      fontFamily: yaxisConfig.labels.style.fontFamily,
      foreColor: Array.isArray(yaxisConfig.labels.style.colors) ? yaxisConfig.labels.style.colors[i] : yaxisConfig.labels.style.colors
    });
    return yaxisLabel;
  }
  /**
   * Widest rendered width among the given label strings. Used to reserve
   * horizontal room for outer (name) labels so the pie can shrink to fit them.
   * @param {string[]} labels
   * @param {{ fontSize?: string, fontFamily?: string }} style
   * @returns {number}
   */
  getMaxLabelWidth(labels, { fontSize, fontFamily } = {}) {
    const graphics = new Graphics(this.w);
    let maxWidth = 0;
    labels.forEach((text) => {
      if (text === null || typeof text === "undefined" || text === "") return;
      const rect = graphics.getTextRects(
        `${text}`,
        fontSize || "12px",
        fontFamily,
        ""
      );
      maxWidth = Math.max(maxWidth, rect.width);
    });
    return maxWidth;
  }
  /**
   * Draw a single outer (name) label: an optional leader line from the slice
   * edge (anchor -> radial elbow -> label) plus the name text (one or more
   * lines, e.g. name + percent). Geometry is computed by the caller (Pie.js)
   * so it can run a de-overlap pass first. The text block is vertically
   * centered on `labelY`, which is where the connector terminates.
   * @param {{
   *   lines: string[],
   *   lineHeight: number,
   *   anchor: { x: number, y: number },
   *   elbow: { x: number, y: number },
   *   labelX: number,
   *   labelY: number,
   *   side: 'left' | 'right',
   *   connector: { show: boolean, width: number, color: string },
   *   style: { fontSize?: string, fontFamily?: string, fontWeight?: string | number },
   *   foreColor: string,
   * }} opts
   */
  drawExternalLabel(opts) {
    return drawOuterLabel(this.w, __spreadProps(__spreadValues({}, opts), {
      groupClass: "apexcharts-pie-name-label-group",
      textClass: "apexcharts-pie-name-label",
      connectorClass: "apexcharts-pie-label-connector"
    }));
  }
}
const D2R$1 = Math.PI / 180;
const R2D$1 = 180 / Math.PI;
function arcPoint(cx, cy, radius, deg) {
  return {
    x: cx + radius * Math.cos((deg - 90) * D2R$1),
    y: cy + radius * Math.sin((deg - 90) * D2R$1)
  };
}
const xy = (p2) => `${p2.x} ${p2.y}`;
function roundedDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, r, spanDeg }) {
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg);
  const degOut = r / rOut * R2D$1;
  const degIn = r / rIn * R2D$1;
  const oStart = ptAt(rOut, a0 + degOut);
  const oEnd = ptAt(rOut, a1 - degOut);
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0;
  const ocEnd = ptAt(rOut, a1);
  const rEndOut = ptAt(rOut - r, a1);
  const ocStart = ptAt(rOut, a0);
  const rStartOut = ptAt(rOut - r, a0);
  const iEnd = ptAt(rIn, a1 - degIn);
  const iStart = ptAt(rIn, a0 + degIn);
  const largeIn = spanDeg - 2 * degIn > 180 ? 1 : 0;
  const icEnd = ptAt(rIn, a1);
  const rEndIn = ptAt(rIn + r, a1);
  const icStart = ptAt(rIn, a0);
  const rStartIn = ptAt(rIn + r, a0);
  return [
    "M",
    xy(oStart),
    "A",
    rOut,
    rOut,
    0,
    largeOut,
    1,
    xy(oEnd),
    "Q",
    xy(ocEnd),
    xy(rEndOut),
    "L",
    xy(rEndIn),
    "Q",
    xy(icEnd),
    xy(iEnd),
    "A",
    rIn,
    rIn,
    0,
    largeIn,
    0,
    xy(iStart),
    "Q",
    xy(icStart),
    xy(rStartIn),
    "L",
    xy(rStartOut),
    "Q",
    xy(ocStart),
    xy(oStart),
    "Z"
  ].join(" ");
}
function roundedPieSegmentPath({ cx, cy, rOut, a0, a1, r, spanDeg }) {
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg);
  const degOut = r / rOut * R2D$1;
  const oStart = ptAt(rOut, a0 + degOut);
  const oEnd = ptAt(rOut, a1 - degOut);
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0;
  const ocEnd = ptAt(rOut, a1);
  const rEndOut = ptAt(rOut - r, a1);
  const ocStart = ptAt(rOut, a0);
  const rStartOut = ptAt(rOut - r, a0);
  return [
    "M",
    xy(oStart),
    "A",
    rOut,
    rOut,
    0,
    largeOut,
    1,
    xy(oEnd),
    "Q",
    xy(ocEnd),
    xy(rEndOut),
    "L",
    `${cx} ${cy}`,
    "L",
    xy(rStartOut),
    "Q",
    xy(ocStart),
    xy(oStart),
    "Z"
  ].join(" ");
}
function sharpDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, spanDeg }) {
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg);
  const largeArc = spanDeg > 180 ? 1 : 0;
  const A = ptAt(rOut, a0);
  const B = ptAt(rOut, a1);
  const C = ptAt(rIn, a1);
  const Din = ptAt(rIn, a0);
  return [
    "M",
    xy(A),
    "A",
    rOut,
    rOut,
    0,
    largeArc,
    1,
    xy(B),
    "L",
    xy(C),
    "A",
    rIn,
    rIn,
    0,
    largeArc,
    0,
    xy(Din),
    "Z"
  ].join(" ");
}
const SLICE_OFFSET_TRANSITION = "transform 320ms cubic-bezier(0.25, 0.8, 0.3, 1)";
const HOVER_OUTLINE_TRANSITION = "opacity 180ms ease-out";
class Pie {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.ctx = ctx;
    this.w = w2;
    this.chartType = this.w.config.chart.type;
    this.initialAnim = this.w.config.chart.animations.enabled;
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled;
    this.animBeginArr = [0];
    this.animDur = 0;
    this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels;
    this.lineColorArr = w2.globals.stroke.colors !== void 0 ? w2.globals.stroke.colors : w2.globals.colors;
    this.defaultSize = Math.min(w2.layout.gridWidth, w2.layout.gridHeight);
    this.centerY = this.defaultSize / 2;
    this.centerX = w2.layout.gridWidth / 2;
    if (w2.config.chart.type === "radialBar") {
      this.fullAngle = 360;
    } else {
      this.fullAngle = Math.abs(
        w2.config.plotOptions.pie.endAngle - w2.config.plotOptions.pie.startAngle
      );
    }
    this.initialAngle = w2.config.plotOptions.pie.startAngle % this.fullAngle;
    w2.globals.radialSize = this.defaultSize / 2.05 - w2.config.stroke.width - (!w2.config.chart.sparkline.enabled ? w2.config.chart.dropShadow.blur : 0);
    this.externalCfg = w2.config.plotOptions.pie.dataLabels.external;
    const dlStyle = w2.config.dataLabels.style;
    this.externalLabelStyle = {
      fontSize: this.externalCfg.fontSize || dlStyle.fontSize,
      fontFamily: this.externalCfg.fontFamily || dlStyle.fontFamily,
      fontWeight: this.externalCfg.fontWeight || dlStyle.fontWeight
    };
    this.externalLabels = [];
    this.externalLabelMaxLines = 1;
    this.externalLabelLineH = parseFloat(this.externalLabelStyle.fontSize) || 12;
    w2.globals.pieExternalLabelMarginY = 0;
    this.showExternalLabels = this.externalCfg.show && this.chartType !== "polarArea";
    if (this.showExternalLabels && !w2.globals.noData) {
      this.reserveExternalLabelSpace();
    }
    this.donutSize = w2.globals.radialSize * parseInt(w2.config.plotOptions.pie.donut.size, 10) / 100;
    const scaleSize = w2.config.plotOptions.pie.customScale;
    const halfW = w2.layout.gridWidth / 2;
    const halfH = w2.layout.gridHeight / 2;
    this.translateX = halfW - halfW * scaleSize;
    this.translateY = halfH - halfH * scaleSize;
    this.dataLabelsGroup = new Graphics(this.w).group({
      class: "apexcharts-datalabels-group",
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${scaleSize})`
    });
    this.maxY = 0;
    this.sliceLabels = [];
    this.sliceSizes = [];
    this.prevSliceSizes = [];
    this.sliceLabelGroups = {};
    this.externalLabelGroups = {};
    this.elHoverOutline = null;
    this.elHoverOutlinePath = null;
    this.hoverOutlineIndex = -1;
    this.prevSectorAngleArr = [];
  }
  /**
   * The text shown in an outer (name) label for slice `i`. Applies the
   * user `name.formatter` if provided, otherwise the raw series name. The
   * formatter may return a string or an array of strings (one per line, e.g.
   * `[name, percent]`); normalize via `getExternalLabelLines`.
   * @param {number} i
   * @returns {string | string[]}
   */
  getExternalLabelText(i) {
    var _a, _b, _c;
    const w2 = this.w;
    const name = w2.seriesData.seriesNames[i];
    const fn = this.externalCfg.formatter;
    if (typeof fn === "function") {
      return fn(name, {
        seriesIndex: i,
        percent: (_b = (_a = w2.globals.seriesPercent) == null ? void 0 : _a[i]) == null ? void 0 : _b[0],
        value: (_c = w2.globals.seriesTotals) == null ? void 0 : _c[i],
        w: w2
      });
    }
    return name == null ? "" : `${name}`;
  }
  /**
   * Outer label content for slice `i` normalized to an array of line strings.
   * Supports a formatter returning an array, or a string with `\n` separators.
   * @param {number} i
   * @returns {string[]}
   */
  getExternalLabelLines(i) {
    const raw = this.getExternalLabelText(i);
    const arr = Array.isArray(raw) ? raw : `${raw == null ? "" : raw}`.split("\n");
    return arr.map((l) => l == null ? "" : `${l}`);
  }
  /**
   * Shrink the pie radius (and reposition its center) so outer name labels and
   * their connector lines fit inside the chart area without clipping. Stores
   * the reserved vertical band on `w.globals.pieExternalLabelMarginY` so
   * Core.resizeNonAxisCharts can grow the SVG height to match.
   */
  reserveExternalLabelSpace() {
    const w2 = this.w;
    const helpers = new CircularChartsHelpers(w2);
    const lineSets = (w2.seriesData.seriesNames || []).map(
      (_, i) => this.getExternalLabelLines(i)
    );
    const maxLabelWidth = helpers.getMaxLabelWidth(lineSets.flat(), {
      fontSize: this.externalLabelStyle.fontSize,
      fontFamily: this.externalLabelStyle.fontFamily
    });
    this.externalLabelMaxLines = lineSets.reduce((m2, s) => Math.max(m2, s.length), 1);
    this.externalLabelLineH = Math.round(
      (parseFloat(this.externalLabelStyle.fontSize) || 12) * 1.35
    );
    const cn = this.externalCfg.connector;
    const blockHeight = this.externalLabelMaxLines * this.externalLabelLineH;
    const mh = maxLabelWidth + (cn.length || 0) + (cn.gap || 0) + 12;
    const mv = blockHeight / 2 + (cn.gap || 0) + 6;
    const fitted = Math.min(
      w2.globals.radialSize,
      w2.layout.gridWidth / 2 - mh,
      w2.layout.gridHeight / 2 - mv
    );
    w2.globals.radialSize = Math.max(fitted, this.defaultSize * 0.15);
    w2.globals.pieExternalLabelMarginY = mv;
    const heightStr = w2.config.chart.height ? String(w2.config.chart.height) : "";
    const userSetFixedHeight = heightStr !== "" && heightStr !== "auto";
    this.centerY = userSetFixedHeight ? w2.layout.gridHeight / 2 : w2.globals.radialSize + mv;
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    var _a;
    const self = this;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const elPie = graphics.group({
      class: "apexcharts-pie"
    });
    if (w2.globals.noData) return elPie;
    let total = 0;
    for (let k = 0; k < series.length; k++) {
      total += Utils.negToZero(series[k]);
    }
    const sectorAngleArr = [];
    const elSeries = graphics.group();
    if (total === 0) {
      total = 1e-5;
    }
    series.forEach((m2) => {
      this.maxY = Math.max(this.maxY, m2);
    });
    if (w2.config.yaxis[0].max) {
      this.maxY = w2.config.yaxis[0].max;
    }
    if (w2.config.grid.position === "back" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    const collapsedIdx = w2.globals.collapsedSeriesIndices || [];
    let polarVisible = 1;
    if (this.chartType === "polarArea") {
      let visible = 0;
      for (let k = 0; k < series.length; k++) {
        if (collapsedIdx.indexOf(k) === -1) visible++;
      }
      polarVisible = Math.max(1, visible);
    }
    for (let i = 0; i < series.length; i++) {
      const angle = this.fullAngle * Utils.negToZero(series[i]) / total;
      sectorAngleArr.push(angle);
      if (this.chartType === "polarArea") {
        sectorAngleArr[i] = collapsedIdx.indexOf(i) > -1 ? 0 : this.fullAngle / polarVisible;
        this.sliceSizes.push(
          w2.globals.radialSize * series[i] / (this.maxY || 1)
        );
      } else {
        this.sliceSizes.push(w2.globals.radialSize);
      }
    }
    const morphActive = ((_a = this.ctx.morphTypeChange) == null ? void 0 : _a.isActive()) === true;
    if (w2.globals.dataChanged && !morphActive) {
      if (this.chartType === "polarArea") {
        const prevValues = w2.globals.previousPaths;
        const stash = w2.globals.prevPolarAngles;
        if (Array.isArray(stash) && stash.length === prevValues.length) {
          this.prevSectorAngleArr = stash.slice();
        } else {
          for (let i = 0; i < prevValues.length; i++) {
            this.prevSectorAngleArr.push(
              this.fullAngle / Math.max(1, prevValues.length)
            );
          }
        }
        let prevMaxY = 0;
        for (let k = 0; k < prevValues.length; k++) {
          prevMaxY = Math.max(prevMaxY, Utils.negToZero(prevValues[k]));
        }
        if (w2.config.yaxis[0].max) {
          prevMaxY = w2.config.yaxis[0].max;
        }
        this.prevSliceSizes = prevValues.map(
          (v2) => w2.globals.radialSize * Utils.negToZero(v2) / (prevMaxY || 1)
        );
      } else {
        let prevTotal = 0;
        for (let k = 0; k < w2.globals.previousPaths.length; k++) {
          prevTotal += Utils.negToZero(w2.globals.previousPaths[k]);
        }
        let previousAngle;
        for (let i = 0; i < w2.globals.previousPaths.length; i++) {
          previousAngle = this.fullAngle * Utils.negToZero(w2.globals.previousPaths[i]) / prevTotal;
          this.prevSectorAngleArr.push(previousAngle);
        }
      }
    }
    if (this.chartType === "polarArea") {
      w2.globals.prevPolarAngles = sectorAngleArr.slice();
    }
    if (this.donutSize < 0) {
      this.donutSize = 0;
    }
    if (this.chartType === "donut") {
      const circle = graphics.drawCircle(this.donutSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: w2.config.plotOptions.pie.donut.background ? w2.config.plotOptions.pie.donut.background : "transparent"
      });
      elSeries.add(circle);
    }
    const elG = self.drawArcs(sectorAngleArr, series);
    this.sliceLabels.forEach((s) => {
      elG.add(s);
    });
    elSeries.attr({
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${w2.config.plotOptions.pie.customScale})`
    });
    elSeries.add(elG);
    elPie.add(elSeries);
    if (this.donutDataLabels.show) {
      const shouldFadeInLabels = this.initialAnim && !w2.globals.resized && !w2.globals.dataChanged && this.animDur > 0;
      const dataLabels = this.renderInnerDataLabels(
        this.dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: shouldFadeInLabels ? 0 : this.donutDataLabels.show
        }
      );
      if (shouldFadeInLabels) {
        const labelsNode = this.dataLabelsGroup.node;
        labelsNode.style.transition = "opacity 280ms ease-out";
        setTimeout(() => {
          labelsNode.style.opacity = "1";
        }, this.animDur);
      }
      elPie.add(dataLabels);
    }
    if (w2.config.grid.position === "front" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    return elPie;
  }
  // core function for drawing pie arcs
  /**
   * @param {any[]} sectorAngleArr
   * @param {any[]} series
   */
  drawArcs(sectorAngleArr, series) {
    var _a, _b, _c, _d, _e;
    const w2 = this.w;
    const filters = new Filters(this.w);
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    const g2 = graphics.group({
      class: "apexcharts-slices"
    });
    this.elHoverOutline = graphics.group({
      class: "apexcharts-pie-hover-outline"
    });
    this.elHoverOutline.node.style.pointerEvents = "none";
    this.elHoverOutline.node.style.opacity = "0";
    if (w2.config.chart.animations.enabled) {
      this.elHoverOutline.node.style.transition = HOVER_OUTLINE_TRANSITION;
    }
    g2.add(this.elHoverOutline);
    let startAngle = this.initialAngle;
    let prevStartAngle = this.initialAngle;
    let endAngle = this.initialAngle;
    let prevEndAngle = this.initialAngle;
    this.strokeWidth = w2.config.stroke.show ? w2.config.stroke.width : 0;
    const morphActive = ((_a = this.ctx.morphTypeChange) == null ? void 0 : _a.isActive()) === true;
    for (let i = 0; i < sectorAngleArr.length; i++) {
      const elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series`,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      g2.add(elPieArc);
      startAngle = endAngle;
      prevStartAngle = prevEndAngle;
      endAngle = startAngle + sectorAngleArr[i];
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i];
      const angle = endAngle < startAngle ? this.fullAngle + endAngle - startAngle : endAngle - startAngle;
      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: this.sliceSizes[i],
        value: series[i]
      });
      const morphFrom = morphActive ? this.ctx.morphTypeChange.getInitialPathFor(i, 0) : null;
      const prevSize = this.chartType === "polarArea" && w2.globals.dataChanged && !morphActive ? this.prevSliceSizes[i] || 0 : void 0;
      const path = morphFrom || this.getChangedPath(prevStartAngle, prevEndAngle, prevSize);
      const elPath = graphics.drawPath({
        d: path,
        // Pie/donut/polarArea data is a single series, so a user-supplied
        // `stroke.colors` shorter than the slice count is NOT padded by the
        // theme engine (unlike fill colors, which cycle). Without this, only
        // slice 0 gets the requested color and the rest fall back to a grey
        // default. Cycle the array — matching fill-color behaviour — so a
        // single `stroke.colors: ['#fff']` borders every slice as expected.
        stroke: Array.isArray(this.lineColorArr) ? (_b = this.lineColorArr[i]) != null ? _b : this.lineColorArr[i % this.lineColorArr.length] : this.lineColorArr,
        strokeWidth: 0,
        fill: pathFill,
        fillOpacity: w2.config.fill.opacity,
        classes: `apexcharts-pie-area apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
      });
      elPath.attr({
        index: 0,
        j: i
      });
      filters.setSelectionFilter(elPath, 0, i);
      if (w2.config.chart.dropShadow.enabled) {
        const shadow = w2.config.chart.dropShadow;
        filters.dropShadow(elPath, shadow, i);
      }
      this.addListeners(elPath, this.donutDataLabels, i);
      let labelPosition = {
        x: 0,
        y: 0
      };
      const midAngle = (startAngle + angle / 2) % this.fullAngle;
      let arcCenter = { x: this.centerX, y: this.centerY };
      if (this.chartType === "pie" || this.chartType === "polarArea") {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w2.globals.radialSize / 1.25 + w2.config.plotOptions.pie.dataLabels.offset,
          midAngle
        );
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w2.globals.radialSize / 2,
          midAngle
        );
      } else if (this.chartType === "donut") {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w2.globals.radialSize + this.donutSize) / 2 + w2.config.plotOptions.pie.dataLabels.offset,
          midAngle
        );
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w2.globals.radialSize + this.donutSize) / 2,
          midAngle
        );
      }
      Graphics.setAttrs(elPath.node, {
        "data:angle": angle,
        "data:startAngle": startAngle,
        "data:strokeWidth": this.strokeWidth,
        "data:value": series[i],
        "data:cx": arcCenter.x,
        "data:cy": arcCenter.y
      });
      elPieArc.add(elPath);
      let pieceClaimed = false;
      if (morphActive) {
        const finalD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: this.sliceSizes[i]
        });
        elPath.node.setAttribute("data:pathFinal", finalD);
        pieceClaimed = ((_d = (_c = this.ctx.morphTypeChange).claimsTargetMark) == null ? void 0 : _d.call(_c, i, 0)) === true;
        if (pieceClaimed) {
          elPath.attr({ d: finalD });
          elPath.node.setAttribute("data:pathOrig", finalD);
          elPath.node.setAttribute("opacity", "0");
          elPath.node.setAttribute("data-piece-hidden", "1");
        }
      }
      let dur = 0;
      if (this.initialAnim && !w2.globals.resized && !w2.globals.dataChanged) {
        dur = angle / this.fullAngle * w2.config.chart.animations.speed;
        if (dur === 0) dur = 1;
        this.animDur = dur + this.animDur;
        this.animBeginArr.push(this.animDur);
      } else {
        this.animBeginArr.push(0);
      }
      if (pieceClaimed) ;
      else if (morphActive && morphFrom) {
        const targetD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: this.sliceSizes[i]
        });
        const morphSpeed = this.ctx.morphTypeChange.getSpeed();
        const animations = this.ctx.animations;
        elPath.node.setAttribute("data:pathOrig", targetD);
        const morphRunner = elPath.animate(morphSpeed).plot(targetD, "polygons").attr({ "stroke-width": this.strokeWidth });
        if (morphRunner && typeof morphRunner.after === "function") {
          morphRunner.after(() => animations.animationCompleted(elPath));
        } else {
          animations.animationCompleted(elPath);
        }
      } else if (this.dynamicAnim && w2.globals.dataChanged) {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          prevSize,
          endAngle,
          startAngle,
          prevStartAngle,
          prevEndAngle,
          animateStartingPos: true,
          i,
          animBeginArr: this.animBeginArr,
          shouldSetPrevPaths: true,
          dur: w2.config.chart.animations.dynamicAnimation.speed
        });
      } else {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur
        });
      }
      if (this.getExpandOffset() > 0) {
        elPath.node.addEventListener("mouseup", this.pieClicked.bind(this, i));
      } else if (i === 0 && Filters.drilldownBlocksSliceOffset(w2)) {
        (_e = this.ctx.drilldown) == null ? void 0 : _e.warnSliceOffsetDisabled();
      }
      if (typeof w2.interact.selectedDataPoints[0] !== "undefined" && w2.interact.selectedDataPoints[0].indexOf(i) > -1) {
        if (this.initialAnim && !w2.globals.resized && !w2.globals.dataChanged && this.animDur > 0) {
          const _this = this;
          const _i = i;
          setTimeout(() => _this.pieClicked(_i, { animate: false }), this.animDur);
        } else {
          this.pieClicked(i, { animate: false });
        }
      }
      if (w2.config.dataLabels.enabled) {
        const xPos = labelPosition.x;
        const yPos = labelPosition.y;
        let text = 100 * angle / this.fullAngle + "%";
        if (angle !== 0 && w2.config.plotOptions.pie.dataLabels.minAngleToShowLabel < sectorAngleArr[i]) {
          const formatter = w2.config.dataLabels.formatter;
          if (formatter !== void 0) {
            text = formatter(w2.globals.seriesPercent[i][0], {
              seriesIndex: i,
              w: w2
            });
          }
          const foreColor = w2.globals.dataLabels.style.colors[i];
          const elPieLabelWrap = graphics.group({
            class: `apexcharts-datalabels`
          });
          const elPieLabel = graphics.drawText({
            x: xPos,
            y: yPos,
            text,
            textAnchor: "middle",
            fontSize: w2.config.dataLabels.style.fontSize,
            fontFamily: w2.config.dataLabels.style.fontFamily,
            fontWeight: w2.config.dataLabels.style.fontWeight,
            foreColor
          });
          elPieLabelWrap.add(elPieLabel);
          if (w2.config.dataLabels.dropShadow.enabled) {
            const textShadow = w2.config.dataLabels.dropShadow;
            filters.dropShadow(elPieLabel, textShadow);
          }
          elPieLabel.node.classList.add("apexcharts-pie-label");
          if (w2.config.chart.animations.animate && w2.globals.resized === false) {
            elPieLabel.node.classList.add("apexcharts-pie-label-delay");
            elPieLabel.node.style.animationDelay = w2.config.chart.animations.speed / 940 + "s";
          }
          this.sliceLabels.push(elPieLabelWrap);
          this.sliceLabelGroups[i] = elPieLabelWrap.node;
        }
      }
      if (this.showExternalLabels && angle !== 0) {
        const lines = this.getExternalLabelLines(i);
        if (lines.some((l) => l !== "")) {
          const anchor = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w2.globals.radialSize,
            midAngle
          );
          const elbow = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w2.globals.radialSize + (this.externalCfg.connector.gap || 0),
            midAngle
          );
          const isRight = elbow.x >= this.centerX;
          const baseLabelX = isRight ? elbow.x + (this.externalCfg.connector.length || 0) : elbow.x - (this.externalCfg.connector.length || 0);
          this.externalLabels.push({
            i,
            lines,
            anchor,
            elbow,
            side: isRight ? "right" : "left",
            labelX: baseLabelX + parseFloat(this.externalCfg.offsetX || 0),
            idealY: elbow.y + parseFloat(this.externalCfg.offsetY || 0),
            connectorColor: this.externalCfg.connector.color || w2.globals.colors[i],
            foreColor: this.externalCfg.color || w2.config.chart.foreColor
          });
        }
      }
    }
    if (this.showExternalLabels && this.externalLabels.length) {
      this.placeExternalLabels();
      const revealOnAnimEnd = Environment.isBrowser() && (morphActive || this.dynamicAnim && w2.globals.dataChanged || this.initialAnim && !w2.globals.resized && !w2.globals.dataChanged);
      this.externalLabels.forEach((lbl) => {
        const group = new CircularChartsHelpers(w2).drawExternalLabel({
          lines: lbl.lines,
          lineHeight: this.externalLabelLineH,
          anchor: lbl.anchor,
          elbow: lbl.elbow,
          labelX: lbl.labelX,
          labelY: lbl.labelY,
          side: lbl.side,
          connector: {
            show: this.externalCfg.connector.show,
            width: this.externalCfg.connector.width,
            color: lbl.connectorColor
          },
          style: this.externalLabelStyle,
          foreColor: lbl.foreColor
        });
        if (revealOnAnimEnd) {
          group.node.classList.add("apexcharts-element-hidden");
          w2.globals.delayedElements.push({ el: group.node });
        }
        this.externalLabelGroups[lbl.i] = group.node;
        g2.add(group);
      });
    }
    return g2;
  }
  /**
   * Vertical de-overlap for outer (name) labels: per side, sort by ideal y and
   * push neighbours apart so they keep at least one line-height of spacing.
   * Mutates each entry's `labelY`. Connector lines re-route to the moved y.
   */
  placeExternalLabels() {
    const w2 = this.w;
    const lineHeight = this.externalLabelMaxLines * this.externalLabelLineH + 2;
    const maxY = this.centerY + w2.globals.radialSize + w2.globals.pieExternalLabelMarginY;
    ["left", "right"].forEach((side) => {
      spaceOutLabels(
        this.externalLabels.filter((l) => l.side === side),
        lineHeight,
        maxY
      );
    });
  }
  /**
   * @param {any} elPath
   * @param {Record<string, any>} dataLabels
   * @param {number} [i] slice index, for the hover outline band
   */
  addListeners(elPath, dataLabels, i) {
    const graphics = new Graphics(this.w, this.ctx);
    elPath.node.addEventListener(
      "mouseenter",
      graphics.pathMouseEnter.bind(graphics, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      graphics.pathMouseLeave.bind(graphics, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      this.revertDataLabelsInner.bind(this)
    );
    if (typeof i === "number") {
      elPath.node.addEventListener(
        "mouseenter",
        this.showHoverOutline.bind(this, i)
      );
      elPath.node.addEventListener(
        "mouseleave",
        this.hideHoverOutline.bind(this)
      );
    }
    elPath.node.addEventListener(
      "mousedown",
      graphics.pathMouseDown.bind(graphics, elPath)
    );
    if (!this.donutDataLabels.total.showAlways) {
      elPath.node.addEventListener(
        "mouseenter",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
      elPath.node.addEventListener(
        "mousedown",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
    }
  }
  // This function can be used for other circle charts too
  /**
   * @param {any} el
   * @param {Record<string, any>} opts
   */
  animatePaths(el, opts) {
    const w2 = this.w;
    const me = this;
    let angle = opts.endAngle < opts.startAngle ? this.fullAngle + opts.endAngle - opts.startAngle : opts.endAngle - opts.startAngle;
    let prevAngle = angle;
    let fromStartAngle = opts.startAngle;
    const toStartAngle = opts.startAngle;
    if (opts.prevStartAngle !== void 0 && opts.prevEndAngle !== void 0) {
      fromStartAngle = opts.prevEndAngle;
      prevAngle = opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle;
    }
    if (opts.i === w2.config.series.length - 1) {
      if (angle + toStartAngle > this.fullAngle) {
        opts.endAngle = opts.endAngle - (angle + toStartAngle);
      } else if (angle + toStartAngle < this.fullAngle) {
        opts.endAngle = opts.endAngle + (this.fullAngle - (angle + toStartAngle));
      }
    }
    if (angle === this.fullAngle) angle = this.fullAngle - 0.01;
    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts);
  }
  /**
   * @param {any} el
   * @param {number} fromStartAngle
   * @param {number} toStartAngle
   * @param {number} angle
   * @param {number} prevAngle
   * @param {Record<string, any>} opts
   */
  animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts) {
    const me = this;
    const w2 = this.w;
    const animations = new Animations(this.w);
    const size = opts.size;
    let path;
    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle;
      prevAngle = angle;
      opts.dur = 0;
    }
    let currAngle = angle;
    let startAngle = toStartAngle;
    const fromAngle = fromStartAngle < toStartAngle ? this.fullAngle + fromStartAngle - toStartAngle : fromStartAngle - toStartAngle;
    const hasPrevSize = typeof opts.prevSize === "number";
    if (w2.globals.dataChanged && opts.shouldSetPrevPaths) {
      if (opts.prevEndAngle) {
        path = me.getPiePath({
          me,
          startAngle: opts.prevStartAngle,
          angle: opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle,
          size: hasPrevSize ? opts.prevSize : size
        });
        el.attr({ d: path });
      }
    }
    if (opts.dur !== 0) {
      el.animate(opts.dur, opts.animBeginArr[opts.i]).after(
        /** @this {any} */
        function() {
          if (me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea") {
            this.animate(
              w2.config.chart.animations.dynamicAnimation.speed
            ).attr({
              "stroke-width": me.strokeWidth
            });
          }
          if (opts.i === w2.config.series.length - 1) {
            animations.animationCompleted(el);
          }
        }
      ).during((pos) => {
        currAngle = fromAngle + (angle - fromAngle) * pos;
        if (opts.animateStartingPos) {
          currAngle = prevAngle + (angle - prevAngle) * pos;
          startAngle = fromStartAngle - prevAngle + (toStartAngle - (fromStartAngle - prevAngle)) * pos;
        }
        path = me.getPiePath({
          me,
          startAngle,
          angle: currAngle,
          size: hasPrevSize ? opts.prevSize + (size - opts.prevSize) * pos : size
        });
        el.node.setAttribute("data:pathOrig", path);
        el.attr({
          d: path
        });
      });
    } else {
      path = me.getPiePath({
        me,
        startAngle,
        angle,
        size
      });
      if (!opts.isTrack) {
        w2.globals.animationEnded = true;
      }
      el.node.setAttribute("data:pathOrig", path);
      el.attr({
        d: path,
        "stroke-width": me.strokeWidth
      });
    }
  }
  /**
   * Toggle slice `i` in or out of the pie. Only one slice sits outside at a
   * time. Bound to `mouseup` on each slice, and also reached from the
   * `toggleDataPointSelection` API and from the pre-selected-slice pass in
   * drawArcs (which passes `animate: false` so the slice is already parked by
   * the time the first frame is painted).
   * @param {number} i
   * @param {{animate?: boolean}} [opts] a MouseEvent when called as a listener,
   *   which carries no `animate`, so real clicks animate
   */
  pieClicked(i, opts) {
    const w2 = this.w;
    const me = this;
    const animate = !(opts && opts.animate === false);
    const elPath = w2.dom.Paper.findOne(
      `.apexcharts-${me.chartType.toLowerCase()}-slice-${i}`
    );
    if (!elPath) return;
    if (elPath.attr("data:pieClicked") === "true") {
      elPath.attr({
        "data:pieClicked": "false"
      });
      this.revertDataLabelsInner();
      this.offsetSlice(i, 0, animate);
      return;
    }
    const allEls = w2.dom.baseEl.getElementsByClassName("apexcharts-pie-area");
    Array.prototype.forEach.call(allEls, (pieSlice) => {
      const wasOut = pieSlice.getAttribute("data:pieClicked") === "true";
      pieSlice.setAttribute("data:pieClicked", "false");
      if (wasOut) {
        this.offsetSlice(parseInt(pieSlice.getAttribute("j"), 10), 0, animate);
      }
    });
    w2.interact.capturedDataPointIndex = i;
    elPath.attr("data:pieClicked", "true");
    this.offsetSlice(i, this.getExpandOffset(), animate);
  }
  /**
   * How far a clicked slice slides out, in px. 0 when the pull-out is off, when
   * drilldown owns the click, and always for polarArea: there the radius
   * encodes the value, so moving a slice outward would read as a bigger number.
   * @returns {number}
   */
  getExpandOffset() {
    const pie = this.w.config.plotOptions.pie;
    if (!pie.expandOnClick || this.chartType === "polarArea") return 0;
    if (Filters.drilldownBlocksSliceOffset(this.w)) return 0;
    const offset = Number(pie.expandOffset);
    return Number.isFinite(offset) && offset > 0 ? offset : 0;
  }
  /**
   * Every node that has to travel with slice `i`: the slice path itself plus
   * its labels, which live in sibling groups so they paint above all slices.
   * @param {number} i
   * @returns {SVGElement[]}
   */
  getSliceMovers(i) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    return [
      elPath ? elPath.node : null,
      this.sliceLabelGroups[i],
      this.externalLabelGroups[i],
      // The hover band, when it is this slice's: clicking a slice you are
      // hovering has to take its outline along, or the band is left behind
      // sitting in the gap the slice just opened.
      this.hoverOutlineIndex === i && this.elHoverOutlinePath ? this.elHoverOutlinePath.node : null
    ].filter(Boolean);
  }
  /**
   * Slide slice `i` `dist` px out of the pie along its own mid-angle, or back
   * to its resting place when `dist` is 0.
   *
   * The slice is *translated*, never re-drawn: the arc keeps the exact radius
   * and span it had, so the pulled-out slice still encodes the same quantity
   * (growing the radius, as this used to, quietly inflates it) and a clean gap
   * opens between it and the rest of the pie.
   * @param {number} i
   * @param {number} dist
   * @param {boolean} [animate] false to park it instantly, with no transition
   */
  offsetSlice(i, dist, animate = true) {
    const w2 = this.w;
    const elPath = w2.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    if (!elPath) return;
    const { dx, dy } = this.getSliceOffsetVector(i, dist);
    const transform = `translate(${dx} ${dy})`;
    const transition = animate && w2.config.chart.animations.enabled ? SLICE_OFFSET_TRANSITION : "";
    this.getSliceMovers(i).forEach((node) => {
      node.style.transition = transition;
      node.setAttribute("transform", transform);
    });
  }
  /**
   * The px vector `dist` along slice `i`'s mid-angle. Zero for a slice that
   * fills the pie: there is no "outside" for it to move to, and sliding it
   * would just shift the whole chart sideways.
   * @param {number} i
   * @param {number} dist
   * @returns {{dx: number, dy: number}}
   */
  getSliceOffsetVector(i, dist) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    const angle = elPath ? parseFloat(elPath.attr("data:angle")) : NaN;
    if (!dist || !Number.isFinite(angle) || angle >= this.fullAngle) {
      return { dx: 0, dy: 0 };
    }
    const startAngle = parseFloat(elPath.attr("data:startAngle"));
    const midRad = Math.PI * (startAngle + angle / 2 - 90) / 180;
    return { dx: dist * Math.cos(midRad), dy: dist * Math.sin(midRad) };
  }
  /**
   * Fade in the hover outline: a translucent band traced just outside the rim
   * of slice `i`, in the slice's own colour. It replaces lightening the slice
   * (see Filters.hoverOutlineOwnsHoverState) so a hovered slice keeps the
   * colour the legend and the data labels claim it has.
   * @param {number} i
   */
  showHoverOutline(i) {
    const w2 = this.w;
    if (!Filters.hoverOutlineOwnsHoverState(w2)) return;
    if (!this.elHoverOutline) return;
    const path = this.getHoverOutlinePath(i);
    if (!path) return;
    const cfg = w2.config.plotOptions.pie.hoverOutline;
    const fill = cfg.color || w2.globals.colors[i];
    if (!this.elHoverOutlinePath) {
      const graphics = new Graphics(w2);
      this.elHoverOutlinePath = graphics.drawPath({
        d: path,
        fill,
        strokeWidth: 0,
        classes: "apexcharts-pie-hover-outline-band"
      });
      this.elHoverOutline.add(this.elHoverOutlinePath);
    }
    this.elHoverOutlinePath.attr({
      d: path,
      fill,
      "fill-opacity": cfg.opacity
    });
    const { dx, dy } = this.getSliceOffsetVector(
      i,
      this.isSliceOut(i) ? this.getExpandOffset() : 0
    );
    this.elHoverOutlinePath.node.style.transition = "";
    this.elHoverOutlinePath.node.setAttribute("transform", `translate(${dx} ${dy})`);
    this.hoverOutlineIndex = i;
    this.elHoverOutline.node.style.opacity = "1";
  }
  /** Fade the hover outline back out, leaving the band node in place. */
  hideHoverOutline() {
    if (this.elHoverOutline) {
      this.elHoverOutline.node.style.opacity = "0";
    }
  }
  /** @param {number} i @returns {boolean} */
  isSliceOut(i) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    return !!elPath && elPath.attr("data:pieClicked") === "true";
  }
  /**
   * Band geometry for the hover outline of slice `i`: an annulus from the
   * slice rim (plus the stroke and the configured clearance) outward, over the
   * same angular extent the slice is actually drawn over, so it lines up with
   * both slice edges even with `spacing` insetting them. Rounded into a pill
   * when the band is thick enough for the fillets to fit.
   * @param {number} i
   * @returns {string | null}
   */
  getHoverOutlinePath(i) {
    const w2 = this.w;
    const cfg = w2.config.plotOptions.pie.hoverOutline;
    const elPath = w2.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    if (!elPath) return null;
    const angle = parseFloat(elPath.attr("data:angle"));
    if (!Number.isFinite(angle) || angle <= 0) return null;
    const size = this.sliceSizes[i];
    const thickness = Number(cfg.size);
    if (!Number.isFinite(size) || !Number.isFinite(thickness) || thickness <= 0) {
      return null;
    }
    const { startDeg, spanDeg } = this.getSliceExtent({
      me: this,
      startAngle: parseFloat(elPath.attr("data:startAngle")),
      angle,
      size
    });
    if (!(spanDeg > 0)) return null;
    const rIn = size + (this.strokeWidth || 0) / 2 + (Number(cfg.gap) || 0);
    const rOut = rIn + thickness;
    const geo = {
      cx: this.centerX,
      cy: this.centerY,
      rIn,
      rOut,
      a0: startDeg,
      a1: startDeg + spanDeg,
      spanDeg
    };
    const r = Math.min(thickness / 2, spanDeg * Math.PI / 180 / 2 * rIn);
    return r > 0.5 ? roundedDonutSegmentPath(__spreadProps(__spreadValues({}, geo), { r })) : sharpDonutSegmentPath(geo);
  }
  /**
   * @param {number} prevStartAngle
   * @param {number} prevEndAngle
   */
  /**
   * @param {number} prevStartAngle
   * @param {number} prevEndAngle
   * @param {number} [prevSize] - polarArea passes its previous slice radius,
   *   so the pre-animation frame sits at the previous VALUE too, not just the
   *   previous angles.
   */
  getChangedPath(prevStartAngle, prevEndAngle, prevSize) {
    let path = "";
    if (this.dynamicAnim && this.w.globals.dataChanged) {
      path = this.getPiePath({
        me: this,
        startAngle: prevStartAngle,
        angle: prevEndAngle - prevStartAngle,
        // @ts-ignore — size is set dynamically during draw()
        size: typeof prevSize === "number" ? prevSize : this.size
      });
    }
    return path;
  }
  /**
   * The angular extent a slice is actually drawn over: the raw start / span
   * clamped so a full circle never overlaps itself, then inset by
   * `plotOptions.pie.spacing`. Shared by getPiePath and the hover outline, so
   * the band lines up with the slice edges instead of with the un-inset angles
   * cached on the path node.
   * @param {{me: any, startAngle: number, angle: number, size: number}} opts
   * @returns {{startDeg: number, spanDeg: number, endDeg: number}}
   */
  getSliceExtent({ me, startAngle, angle, size }) {
    const w2 = this.w;
    let startDeg = startAngle;
    let endDeg = angle + startAngle;
    if (Math.ceil(endDeg) >= this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle) {
      endDeg = this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle - 0.01;
    }
    let spanDeg = endDeg - startDeg;
    const isSliceType = me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea";
    const spacing = w2.config.plotOptions.pie.spacing;
    if (isSliceType && spacing > 0 && spanDeg > 0) {
      const rRef = me.chartType === "donut" ? (size + me.donutSize) / 2 : size;
      const gapDeg = rRef > 0 ? spacing / rRef * (180 / Math.PI) : 0;
      const inset = Math.min(gapDeg / 2, Math.max(0, spanDeg / 2 - 0.5));
      startDeg += inset;
      spanDeg -= 2 * inset;
    }
    endDeg = startDeg + spanDeg;
    if (Math.ceil(endDeg) > this.fullAngle) endDeg -= this.fullAngle;
    return { startDeg, spanDeg, endDeg };
  }
  /** @param {{me: any, startAngle: any, angle: any, size: any}} opts */
  getPiePath({ me, startAngle, angle, size }) {
    let path;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const { startDeg, spanDeg, endDeg } = this.getSliceExtent({
      me,
      startAngle,
      angle,
      size
    });
    const isSliceType = me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea";
    const startRadians = Math.PI * (startDeg - 90) / 180;
    const borderRadius = w2.config.plotOptions.pie.borderRadius;
    if (borderRadius > 0 && isSliceType) {
      const roundedPath = this.getRoundedSlicePath({
        me,
        startDeg,
        spanDeg,
        size,
        borderRadius
      });
      if (roundedPath) return roundedPath;
    }
    const endRadians = Math.PI * (endDeg - 90) / 180;
    const x1 = me.centerX + size * Math.cos(startRadians);
    const y1 = me.centerY + size * Math.sin(startRadians);
    const x2 = me.centerX + size * Math.cos(endRadians);
    const y2 = me.centerY + size * Math.sin(endRadians);
    const startInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      endDeg
    );
    const endInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      startDeg
    );
    const largeArc = spanDeg > 180 ? 1 : 0;
    const pathBeginning = ["M", x1, y1, "A", size, size, 0, largeArc, 1, x2, y2];
    if (me.chartType === "donut") {
      path = [
        ...pathBeginning,
        "L",
        startInner.x,
        startInner.y,
        "A",
        me.donutSize,
        me.donutSize,
        0,
        largeArc,
        0,
        endInner.x,
        endInner.y,
        "L",
        x1,
        y1,
        "z"
      ].join(" ");
    } else if (me.chartType === "pie" || me.chartType === "polarArea") {
      path = [...pathBeginning, "L", me.centerX, me.centerY, "L", x1, y1].join(
        " "
      );
    } else {
      path = [...pathBeginning].join(" ");
    }
    return graphics.roundPathCorners(path, this.strokeWidth * 2);
  }
  /**
   * Build a slice path with rounded corners (plotOptions.pie.borderRadius).
   *
   * The generic roundPathCorners() only rounds line->line joins, but a slice
   * corner is an arc<->line join, so we construct the fillets explicitly here:
   * every corner is inset by the (clamped) radius along both the arc and the
   * radial edge, and a quadratic Bezier with its control point at the original
   * sharp corner bridges the two inset points. Donut slices round all four
   * corners; pie / polarArea slices round the two outer corners and keep the
   * center apex sharp.
   *
   * Returns null when the slice is too small to round meaningfully, so the
   * caller can fall back to a sharp-corner path.
   *
   * @param {{me: any, startDeg: number, spanDeg: number, size: number, borderRadius: number}} opts
   * @returns {string | null}
   */
  getRoundedSlicePath({ me, startDeg, spanDeg, size, borderRadius }) {
    if (!(spanDeg > 0)) return null;
    const D2R2 = Math.PI / 180;
    const cx = me.centerX;
    const cy = me.centerY;
    const isDonut = me.chartType === "donut";
    const rOut = size;
    const rIn = isDonut ? me.donutSize : 0;
    const spanRad = spanDeg * D2R2;
    let r = borderRadius;
    r = Math.min(r, spanRad * rOut / 2);
    if (isDonut) {
      r = Math.min(r, spanRad * rIn / 2);
      r = Math.min(r, (rOut - rIn) / 2);
    } else {
      r = Math.min(r, rOut / 2);
    }
    if (!(r > 0.5)) return null;
    const a0 = startDeg;
    const a1 = startDeg + spanDeg;
    if (isDonut) {
      return roundedDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, r, spanDeg });
    }
    return roundedPieSegmentPath({ cx, cy, rOut, a0, a1, r, spanDeg });
  }
  /**
   * @param {any} parent
   */
  drawPolarElements(parent) {
    const w2 = this.w;
    const scale = new Scales(this.w);
    const graphics = new Graphics(this.w);
    const helpers = new CircularChartsHelpers(this.w);
    const gCircles = graphics.group();
    const gYAxis = graphics.group();
    const yScale = scale.niceScale(0, Math.ceil(this.maxY), 0);
    const yTexts = yScale.result.reverse();
    const len = yScale.result.length;
    this.maxY = yScale.niceMax;
    let circleSize = w2.globals.radialSize;
    const diff = circleSize / (len - 1);
    for (let i = 0; i < len - 1; i++) {
      const circle = graphics.drawCircle(circleSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: "none",
        "stroke-width": w2.config.plotOptions.polarArea.rings.strokeWidth,
        stroke: w2.config.plotOptions.polarArea.rings.strokeColor
      });
      if (w2.config.yaxis[0].show) {
        const yLabel = helpers.drawYAxisTexts(
          this.centerX,
          this.centerY - circleSize + parseInt(w2.config.yaxis[0].labels.style.fontSize, 10) / 2,
          i,
          yTexts[i]
        );
        gYAxis.add(yLabel);
      }
      gCircles.add(circle);
      circleSize = circleSize - diff;
    }
    this.drawSpokes(parent);
    parent.add(gCircles);
    parent.add(gYAxis);
  }
  /**
   * @param {any} dataLabelsGroup
   * @param {Record<string, any>} dataLabelsConfig
   * @param {Record<string, any>} opts
   */
  renderInnerDataLabels(dataLabelsGroup, dataLabelsConfig, opts) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const showTotal = dataLabelsConfig.total.show;
    dataLabelsGroup.node.innerHTML = "";
    dataLabelsGroup.node.style.opacity = opts.opacity;
    const x = opts.centerX;
    const y = !this.donutDataLabels.total.label ? opts.centerY - opts.centerY / 6 : opts.centerY;
    let labelColor, valueColor;
    if (dataLabelsConfig.name.color === void 0) {
      labelColor = w2.globals.colors[0];
    } else {
      labelColor = dataLabelsConfig.name.color;
    }
    let labelFontSize = dataLabelsConfig.name.fontSize;
    let labelFontFamily = dataLabelsConfig.name.fontFamily;
    let labelFontWeight = dataLabelsConfig.name.fontWeight;
    if (dataLabelsConfig.value.color === void 0) {
      valueColor = w2.config.chart.foreColor;
    } else {
      valueColor = dataLabelsConfig.value.color;
    }
    const lbFormatter = dataLabelsConfig.value.formatter;
    let val = "";
    let name = "";
    if (showTotal) {
      labelColor = dataLabelsConfig.total.color;
      labelFontSize = dataLabelsConfig.total.fontSize;
      labelFontFamily = dataLabelsConfig.total.fontFamily;
      labelFontWeight = dataLabelsConfig.total.fontWeight;
      name = !this.donutDataLabels.total.label ? "" : dataLabelsConfig.total.label;
      val = dataLabelsConfig.total.formatter(w2);
    } else {
      if (w2.seriesData.series.length === 1) {
        val = lbFormatter(w2.seriesData.series[0], w2);
        name = w2.seriesData.seriesNames[0];
      }
    }
    if (name) {
      name = dataLabelsConfig.name.formatter(
        name,
        dataLabelsConfig.total.show,
        w2
      );
    }
    if (dataLabelsConfig.name.show) {
      const elLabel = graphics.drawText({
        x,
        y: y + parseFloat(dataLabelsConfig.name.offsetY),
        text: name,
        textAnchor: "middle",
        foreColor: labelColor,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily
      });
      elLabel.node.classList.add("apexcharts-datalabel-label");
      dataLabelsGroup.add(elLabel);
    }
    if (dataLabelsConfig.value.show) {
      const valOffset = dataLabelsConfig.name.show ? parseFloat(dataLabelsConfig.value.offsetY) + 16 : dataLabelsConfig.value.offsetY;
      const elValue = graphics.drawText({
        x,
        y: y + valOffset,
        text: val,
        textAnchor: "middle",
        foreColor: valueColor,
        fontWeight: dataLabelsConfig.value.fontWeight,
        fontSize: dataLabelsConfig.value.fontSize,
        fontFamily: dataLabelsConfig.value.fontFamily
      });
      elValue.node.classList.add("apexcharts-datalabel-value");
      dataLabelsGroup.add(elValue);
    }
    return dataLabelsGroup;
  }
  /**
   *
   * @param {string} name - The name of the series
   * @param {string} val - The value of that series
   * @param {any} el - Optional el (indicates which series was hovered/clicked). If this param is not present, means we need to show total
   * @param {Record<string, any>} labelsConfig
   */
  printInnerLabels(labelsConfig, name, val, el) {
    const w2 = this.w;
    let labelColor;
    if (el) {
      if (labelsConfig.name.color === void 0) {
        labelColor = w2.globals.colors[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
      } else {
        labelColor = labelsConfig.name.color;
      }
    } else {
      if (w2.seriesData.series.length > 1 && labelsConfig.total.show) {
        labelColor = labelsConfig.total.color;
      }
    }
    const elLabel = w2.dom.baseEl.querySelector(".apexcharts-datalabel-label");
    const elValue = w2.dom.baseEl.querySelector(".apexcharts-datalabel-value");
    const lbFormatter = labelsConfig.value.formatter;
    val = lbFormatter(val, w2);
    if (!el && typeof labelsConfig.total.formatter === "function") {
      val = labelsConfig.total.formatter(w2);
    }
    const isTotal = name === labelsConfig.total.label;
    name = !this.donutDataLabels.total.label ? "" : labelsConfig.name.formatter(name, isTotal, w2);
    if (elLabel !== null) {
      elLabel.textContent = name;
    }
    if (elValue !== null) {
      elValue.textContent = val;
    }
    if (elLabel !== null) {
      const elLabelEl = (
        /** @type {HTMLElement} */
        elLabel
      );
      elLabelEl.style.fill = labelColor;
    }
  }
  /**
   * @param {any} el
   * @param {Record<string, any>} dataLabelsConfig
   */
  printDataLabelsInner(el, dataLabelsConfig) {
    const w2 = this.w;
    const val = el.getAttribute("data:value");
    const name = w2.seriesData.seriesNames[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
    if (w2.seriesData.series.length > 1) {
      this.printInnerLabels(dataLabelsConfig, name, val, el);
    }
    const dataLabelsGroup = w2.dom.baseEl.querySelector(
      ".apexcharts-datalabels-group"
    );
    if (dataLabelsGroup !== null) {
      const dataLabelsGroupEl = (
        /** @type {HTMLElement} */
        dataLabelsGroup
      );
      dataLabelsGroupEl.style.opacity = "1";
    }
  }
  /**
   * @param {any} parent
   */
  drawSpokes(parent) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const spokeConfig = w2.config.plotOptions.polarArea.spokes;
    if (spokeConfig.strokeWidth === 0) return;
    const spokes = [];
    const angleDivision = 360 / w2.seriesData.series.length;
    for (let i = 0; i < w2.seriesData.series.length; i++) {
      spokes.push(
        Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w2.globals.radialSize,
          w2.config.plotOptions.pie.startAngle + angleDivision * i
        )
      );
    }
    spokes.forEach((p2, i) => {
      const line = graphics.drawLine(
        p2.x,
        p2.y,
        this.centerX,
        this.centerY,
        Array.isArray(spokeConfig.connectorColors) ? spokeConfig.connectorColors[i] : spokeConfig.connectorColors
      );
      parent.add(line);
    });
  }
  revertDataLabelsInner() {
    const w2 = this.w;
    if (this.donutDataLabels.show) {
      const dataLabelsGroup = w2.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      );
      const dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show
        }
      );
      const elPie = w2.dom.Paper.findOne(
        ".apexcharts-radialbar, .apexcharts-pie"
      );
      elPie.add(dataLabels);
    }
  }
}
const RADAR_HIT_AREA_SIZE = 5;
class Radar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.ctx = ctx;
    this.w = w2;
    this.chartType = this.w.config.chart.type;
    this.initialAnim = this.w.config.chart.animations.enabled;
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled;
    this.animDur = 0;
    this.graphics = new Graphics(this.w);
    this.lineColorArr = w2.globals.stroke.colors !== void 0 ? w2.globals.stroke.colors : w2.globals.colors;
    this.defaultSize = w2.globals.svgHeight < w2.globals.svgWidth ? w2.layout.gridHeight : w2.layout.gridWidth;
    this.isLog = w2.config.yaxis[0].logarithmic;
    this.logBase = w2.config.yaxis[0].logBase;
    this.coreUtils = new CoreUtils(this.w);
    this.maxValue = this.isLog ? this.coreUtils.getLogVal(this.logBase, w2.globals.maxY, 0) : w2.globals.maxY;
    this.minValue = this.isLog ? this.coreUtils.getLogVal(this.logBase, this.w.globals.minY, 0) : w2.globals.minY;
    this.polygons = w2.config.plotOptions.radar.polygons;
    this.strokeWidth = w2.config.stroke.show ? w2.config.stroke.width : 0;
    this.size = this.defaultSize / 2.1 - this.strokeWidth - w2.config.chart.dropShadow.blur;
    if (w2.config.xaxis.labels.show) {
      this.size = this.size - w2.layout.xAxisLabelsWidth / 1.75;
    }
    if (w2.config.plotOptions.radar.size !== void 0) {
      this.size = w2.config.plotOptions.radar.size;
    }
    this.dataRadiusOfPercent = /** @type {any} */
    [];
    this.dataRadius = /** @type {any} */
    [];
    this.angleArr = /** @type {any} */
    [];
    this.dataPointsLen = 0;
    this.disAngle = 0;
    this.yaxisLabelsTextsPos = [];
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    const w2 = this.w;
    const fill = new Fill(this.w);
    const allSeries = [];
    const dataLabels = new DataLabels(this.w, this.ctx);
    if (series.length) {
      this.dataPointsLen = series[w2.globals.maxValsInArrayIndex].length;
    }
    this.disAngle = Math.PI * 2 / this.dataPointsLen;
    const halfW = w2.layout.gridWidth / 2;
    const halfH = w2.layout.gridHeight / 2;
    const translateX = halfW + w2.config.plotOptions.radar.offsetX;
    const translateY = halfH + w2.config.plotOptions.radar.offsetY;
    const ret = this.graphics.group({
      class: "apexcharts-radar-series apexcharts-plot-series",
      transform: `translate(${translateX || 0}, ${translateY || 0})`
    });
    let dataPointsPos = [];
    let elPointsMain = null;
    let elDataPointsMain = null;
    this.yaxisLabels = this.graphics.group({
      class: "apexcharts-yaxis"
    });
    series.forEach((s, i) => {
      const longestSeries = s.length === w2.globals.dataPoints;
      const elSeries = this.graphics.group().attr({
        class: `apexcharts-series`,
        "data:longestSeries": longestSeries,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      this.dataRadiusOfPercent[i] = [];
      this.dataRadius[i] = [];
      this.angleArr[i] = [];
      s.forEach((dv, j) => {
        const range = Math.abs(this.maxValue - this.minValue);
        dv = dv - this.minValue;
        if (this.isLog) {
          dv = this.coreUtils.getLogVal(this.logBase, dv, 0);
        }
        this.dataRadiusOfPercent[i][j] = dv / range;
        this.dataRadius[i][j] = this.dataRadiusOfPercent[i][j] * this.size;
        this.angleArr[i][j] = j * this.disAngle;
      });
      dataPointsPos = this.getDataPointsPos(
        this.dataRadius[i],
        this.angleArr[i]
      );
      const paths = this.createPaths(dataPointsPos, {
        x: 0,
        y: 0
      });
      elPointsMain = this.graphics.group({
        class: "apexcharts-series-markers-wrap apexcharts-element-hidden"
      });
      elDataPointsMain = this.graphics.group({
        class: `apexcharts-datalabels`,
        "data:realIndex": i
      });
      w2.globals.delayedElements.push({
        el: elPointsMain.node,
        index: i
      });
      const defaultRenderedPathOptions = {
        i,
        realIndex: i,
        animationDelay: i,
        initialSpeed: w2.config.chart.animations.speed,
        dataChangeSpeed: w2.config.chart.animations.dynamicAnimation.speed,
        className: `apexcharts-radar`,
        shouldClipToGrid: false,
        bindEventsOnPaths: false,
        stroke: w2.globals.stroke.colors[i],
        strokeLineCap: w2.config.stroke.lineCap
      };
      let pathFrom = null;
      if (w2.globals.previousPaths.length > 0) {
        pathFrom = this.getPreviousPath(i);
      }
      for (let p2 = 0; p2 < paths.linePathsTo.length; p2++) {
        const renderedLinePath = this.graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: pathFrom === null ? paths.linePathsFrom[p2] : pathFrom,
          pathTo: paths.linePathsTo[p2],
          strokeWidth: Array.isArray(this.strokeWidth) ? this.strokeWidth[i] : this.strokeWidth,
          fill: "none",
          drawShadow: false
        }));
        elSeries.add(renderedLinePath);
        const pathFill = fill.fillPath({
          seriesNumber: i
        });
        const renderedAreaPath = this.graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: pathFrom === null ? paths.areaPathsFrom[p2] : pathFrom,
          pathTo: paths.areaPathsTo[p2],
          strokeWidth: 0,
          fill: pathFill,
          drawShadow: false,
          // Radial mask: the area fill blooms outward from the radar's center
          // (in this group's local coords) instead of the default L→R rect wipe.
          drawMask: { type: "radial", cx: 0, cy: 0, r: this.size }
        }));
        if (w2.config.chart.dropShadow.enabled) {
          const filters = new Filters(this.w);
          const shadow = w2.config.chart.dropShadow;
          filters.dropShadow(
            renderedAreaPath,
            Object.assign({}, shadow, { noUserSpaceOnUse: true }),
            i
          );
        }
        elSeries.add(renderedAreaPath);
      }
      s.forEach((sj, j) => {
        const markers = new Markers(this.w, this.ctx);
        const opts = markers.getMarkerConfig({
          cssClass: "apexcharts-marker",
          seriesIndex: i,
          dataPointIndex: j
        });
        if (!opts.pSize) {
          opts.pSize = RADAR_HIT_AREA_SIZE;
          opts.pointFillColor = "transparent";
          opts.pointStrokeColor = "transparent";
          opts.pointStrokeWidth = 0;
        }
        const point = this.graphics.drawMarker(
          dataPointsPos[j].x,
          dataPointsPos[j].y,
          opts
        );
        point.attr("rel", j);
        point.attr("j", j);
        point.attr("index", i);
        point.node.setAttribute("default-marker-size", opts.pSize);
        const elPointsWrap = this.graphics.group({
          class: "apexcharts-series-markers"
        });
        if (elPointsWrap) {
          elPointsWrap.add(point);
        }
        elPointsMain.add(elPointsWrap);
        elSeries.add(elPointsMain);
        const dataLabelsConfig = w2.config.dataLabels;
        if (dataLabelsConfig.enabled) {
          const text = dataLabelsConfig.formatter(w2.seriesData.series[i][j], {
            seriesIndex: i,
            dataPointIndex: j,
            w: w2
          });
          dataLabels.plotDataLabelsText({
            x: dataPointsPos[j].x,
            y: dataPointsPos[j].y,
            text,
            textAnchor: "middle",
            i,
            j: i,
            // `j` above is the series index (kept for the color lookup), so
            // pass the real data point index for per-point offsets
            seriesIndex: i,
            dataPointIndex: j,
            parent: elDataPointsMain,
            offsetCorrection: false,
            dataLabelsConfig: __spreadValues({}, dataLabelsConfig)
          });
        }
        elSeries.add(elDataPointsMain);
      });
      allSeries.push(elSeries);
    });
    this.drawPolygons({
      parent: ret
    });
    if (w2.config.xaxis.labels.show) {
      const xaxisTexts = this.drawXAxisTexts();
      ret.add(xaxisTexts);
    }
    allSeries.forEach((elS) => {
      ret.add(elS);
    });
    ret.add(this.yaxisLabels);
    return ret;
  }
  /**
   * @param {Record<string, any>} opts
   */
  drawPolygons(opts) {
    const w2 = this.w;
    const { parent } = opts;
    const helpers = new CircularChartsHelpers(this.w);
    const yaxisTexts = w2.globals.yAxisScale[0].result.reverse();
    const layers = yaxisTexts.length;
    const radiusSizes = [];
    const layerDis = this.size / (layers - 1);
    for (let i = 0; i < layers; i++) {
      radiusSizes[i] = layerDis * i;
    }
    radiusSizes.reverse();
    const polygonStrings = [];
    const lines = [];
    radiusSizes.forEach((radiusSize, r) => {
      const polygon = Utils.getPolygonPos(radiusSize, this.dataPointsLen);
      let string = "";
      polygon.forEach((p2, i) => {
        if (r === 0) {
          const line = this.graphics.drawLine(
            p2.x,
            p2.y,
            0,
            0,
            Array.isArray(this.polygons.connectorColors) ? this.polygons.connectorColors[i] : this.polygons.connectorColors
          );
          lines.push(line);
        }
        if (i === 0) {
          this.yaxisLabelsTextsPos.push({
            x: p2.x,
            y: p2.y
          });
        }
        string += p2.x + "," + p2.y + " ";
      });
      polygonStrings.push(string);
    });
    polygonStrings.forEach((p2, i) => {
      const strokeColors = this.polygons.strokeColors;
      const strokeWidth = this.polygons.strokeWidth;
      const polygon = this.graphics.drawPolygon(
        p2,
        Array.isArray(strokeColors) ? strokeColors[i] : strokeColors,
        Array.isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
        w2.globals.radarPolygons.fill.colors[i]
      );
      parent.add(polygon);
    });
    lines.forEach((l) => {
      parent.add(l);
    });
    if (w2.config.yaxis[0].show) {
      this.yaxisLabelsTextsPos.forEach(
        (p2, i) => {
          const yText = helpers.drawYAxisTexts(p2.x, p2.y, i, yaxisTexts[i]);
          this.yaxisLabels.add(yText);
        }
      );
    }
  }
  drawXAxisTexts() {
    const w2 = this.w;
    const xaxisLabelsConfig = w2.config.xaxis.labels;
    const elXAxisWrap = this.graphics.group({
      class: "apexcharts-xaxis"
    });
    const polygonPos = Utils.getPolygonPos(this.size, this.dataPointsLen);
    w2.labelData.labels.forEach((label, i) => {
      const formatter = w2.config.xaxis.labels.formatter;
      const dataLabels = new DataLabels(this.w, this.ctx);
      if (polygonPos[i]) {
        const textPos = this.getTextPos(polygonPos[i], this.size);
        const text = formatter(label, {
          seriesIndex: -1,
          dataPointIndex: i,
          w: w2
        });
        const dataLabelText = dataLabels.plotDataLabelsText({
          x: textPos.newX,
          y: textPos.newY,
          text,
          textAnchor: textPos.textAnchor,
          i,
          j: i,
          parent: elXAxisWrap,
          className: "apexcharts-xaxis-label",
          color: Array.isArray(xaxisLabelsConfig.style.colors) && xaxisLabelsConfig.style.colors[i] ? xaxisLabelsConfig.style.colors[i] : "#a8a8a8",
          dataLabelsConfig: __spreadValues({
            textAnchor: textPos.textAnchor,
            dropShadow: { enabled: false }
          }, xaxisLabelsConfig),
          offsetCorrection: false
        });
        dataLabelText.on("click", (e) => {
          if (typeof w2.config.chart.events.xAxisLabelClick === "function") {
            const opts = Object.assign({}, w2, {
              labelIndex: i
            });
            w2.config.chart.events.xAxisLabelClick(e, this.ctx, opts);
          }
        });
      }
    });
    return elXAxisWrap;
  }
  /**
   * @param {Array<Record<string, any>>} pos
   * @param {Record<string, any>} origin
   */
  createPaths(pos, origin) {
    const linePathsTo = [];
    let linePathsFrom = [];
    const areaPathsTo = [];
    let areaPathsFrom = [];
    if (pos.length) {
      linePathsFrom = [this.graphics.move(origin.x, origin.y)];
      areaPathsFrom = [this.graphics.move(origin.x, origin.y)];
      let linePathTo = this.graphics.move(pos[0].x, pos[0].y);
      let areaPathTo = this.graphics.move(pos[0].x, pos[0].y);
      pos.forEach((p2, i) => {
        linePathTo += this.graphics.line(p2.x, p2.y);
        areaPathTo += this.graphics.line(p2.x, p2.y);
        if (i === pos.length - 1) {
          linePathTo += "Z";
          areaPathTo += "Z";
        }
      });
      linePathsTo.push(linePathTo);
      areaPathsTo.push(areaPathTo);
    }
    return {
      linePathsFrom,
      linePathsTo,
      areaPathsFrom,
      areaPathsTo
    };
  }
  /**
   * @param {Record<string, any>} pos
   * @param {number} polygonSize
   */
  getTextPos(pos, polygonSize) {
    const limit = 10;
    let textAnchor = "middle";
    let newX = pos.x;
    let newY = pos.y;
    if (Math.abs(pos.x) >= limit) {
      if (pos.x > 0) {
        textAnchor = "start";
        newX += 10;
      } else if (pos.x < 0) {
        textAnchor = "end";
        newX -= 10;
      }
    } else {
      textAnchor = "middle";
    }
    if (Math.abs(pos.y) >= polygonSize - limit) {
      if (pos.y < 0) {
        newY -= 10;
      } else if (pos.y > 0) {
        newY += 10;
      }
    }
    return {
      textAnchor,
      newX,
      newY
    };
  }
  /**
   * @param {number} realIndex
   */
  getPreviousPath(realIndex) {
    const w2 = this.w;
    let pathFrom = null;
    for (let pp = 0; pp < w2.globals.previousPaths.length; pp++) {
      const gpp = w2.globals.previousPaths[pp];
      if (gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(String(realIndex), 10)) {
        if (typeof w2.globals.previousPaths[pp].paths[0] !== "undefined") {
          pathFrom = w2.globals.previousPaths[pp].paths[0].d;
        }
      }
    }
    return pathFrom;
  }
  /**
   * @param {any[]} dataRadiusArr
   * @param {any[]} angleArr
   */
  getDataPointsPos(dataRadiusArr, angleArr, dataPointsLen = this.dataPointsLen) {
    dataRadiusArr = dataRadiusArr || [];
    angleArr = angleArr || [];
    const dataPointsPosArray = [];
    for (let j = 0; j < dataPointsLen; j++) {
      const curPointPos = {};
      curPointPos.x = dataRadiusArr[j] * Math.sin(angleArr[j]);
      curPointPos.y = -dataRadiusArr[j] * Math.cos(angleArr[j]);
      dataPointsPosArray.push(curPointPos);
    }
    return dataPointsPosArray;
  }
}
class Radial extends Pie {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    super(w2, ctx);
    this.ctx = ctx;
    this.w = w2;
    this.animBeginArr = [0];
    this.animDur = 0;
    this.startAngle = w2.config.plotOptions.radialBar.startAngle;
    this.endAngle = w2.config.plotOptions.radialBar.endAngle;
    this.totalAngle = Math.abs(
      w2.config.plotOptions.radialBar.endAngle - w2.config.plotOptions.radialBar.startAngle
    );
    this.trackStartAngle = w2.config.plotOptions.radialBar.track.startAngle;
    this.trackEndAngle = w2.config.plotOptions.radialBar.track.endAngle;
    this.barLabels = this.w.config.plotOptions.radialBar.barLabels;
    this.donutDataLabels = this.w.config.plotOptions.radialBar.dataLabels;
    this.radialDataLabels = this.donutDataLabels;
    if (!this.trackStartAngle) this.trackStartAngle = this.startAngle;
    if (!this.trackEndAngle) this.trackEndAngle = this.endAngle;
    if (this.endAngle === 360) this.endAngle = 359.99;
    this.margin = parseInt(w2.config.plotOptions.radialBar.track.margin, 10);
    this.onBarLabelClick = this.onBarLabelClick.bind(this);
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    var _a;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const ret = graphics.group({
      class: "apexcharts-radialbar"
    });
    if (w2.globals.noData) return ret;
    const elSeries = graphics.group();
    const centerY = this.defaultSize / 2;
    const centerX = w2.layout.gridWidth / 2;
    let size = this.defaultSize / 2.05;
    if (!w2.config.chart.sparkline.enabled) {
      size = size - w2.config.stroke.width - w2.config.chart.dropShadow.blur;
    }
    const colorArr = w2.globals.fill.colors;
    const rb = w2.config.plotOptions.radialBar;
    const hasBands = Array.isArray(rb.bands) && rb.bands.length > 0;
    const hideTrack = hasBands && rb.bandsStyle && rb.bandsStyle.hideTrackWhenPresent;
    const isNeedleShape = rb.shape === "needle";
    if (rb.track.show && !hideTrack) {
      const elTracks = this.drawTracks({
        size,
        centerX,
        centerY,
        colorArr,
        series
      });
      elSeries.add(elTracks);
    }
    if (hasBands) {
      const elBands = this.drawBands({
        size,
        centerX,
        centerY,
        series
      });
      elSeries.add(elBands);
    }
    const elG = this.drawArcs({
      size,
      centerX,
      centerY,
      colorArr,
      series,
      // When `needle.showValueArc` is true, render both the filled value-arc
      // and the needle on top — required for gauges that want a progress
      // ring with a pointer indicator (default still hides the arc when in
      // needle shape, preserving prior behavior).
      skipValueArc: isNeedleShape && !((_a = rb.needle) == null ? void 0 : _a.showValueArc)
    });
    if (rb.ticks && rb.ticks.show) {
      const elTicks = this.drawTicks({
        size,
        centerX,
        centerY,
        series
      });
      const isInitialMount = this.initialAnim && !w2.globals.dataChanged && !w2.globals.resized;
      if (isInitialMount && Environment.isBrowser() && w2.globals.shouldAnimate) {
        const ticksNode = elTicks.node;
        ticksNode.style.opacity = "0";
        ticksNode.style.transition = "opacity 280ms ease-out";
        const sweepDur = w2.config.chart.animations.speed || 800;
        setTimeout(() => {
          ticksNode.style.opacity = "1";
        }, sweepDur);
      }
      elSeries.add(elTicks);
    }
    if (isNeedleShape) {
      const elNeedle = this.drawNeedle({
        size,
        centerX,
        centerY,
        series
      });
      elSeries.add(elNeedle);
    }
    let totalAngle = 360;
    if (w2.config.plotOptions.radialBar.startAngle < 0) {
      totalAngle = this.totalAngle;
    }
    const angleRatio = (360 - totalAngle) / 360;
    w2.globals.radialSize = size - size * angleRatio;
    if (this.radialDataLabels.value.show) {
      const offset = Math.max(
        this.radialDataLabels.value.offsetY,
        this.radialDataLabels.name.offsetY
      );
      w2.globals.radialSize += offset * angleRatio;
    }
    elSeries.add(elG.g);
    if (w2.config.plotOptions.radialBar.hollow.position === "front") {
      elG.g.add(elG.elHollow);
      if (elG.dataLabels) {
        elG.g.add(elG.dataLabels);
      }
    }
    ret.add(elSeries);
    return ret;
  }
  /**
   * @param {Record<string, any>} opts
   */
  drawTracks(opts) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const g2 = graphics.group({
      class: "apexcharts-tracks"
    });
    const filters = new Filters(this.w);
    const fill = new Fill(this.w);
    const strokeWidth = this.getStrokeWidth(opts);
    opts.size = opts.size - strokeWidth / 2;
    for (let i = 0; i < opts.series.length; i++) {
      const elRadialBarTrack = graphics.group({
        class: "apexcharts-radialbar-track apexcharts-track"
      });
      g2.add(elRadialBarTrack);
      elRadialBarTrack.attr({
        rel: i + 1
      });
      opts.size = opts.size - strokeWidth - this.margin;
      const trackConfig = w2.config.plotOptions.radialBar.track;
      const pathFill = fill.fillPath({
        seriesNumber: 0,
        size: opts.size,
        fillColors: Array.isArray(trackConfig.background) ? trackConfig.background[i] : trackConfig.background,
        solid: true
      });
      const startAngle = this.trackStartAngle;
      let endAngle = this.trackEndAngle;
      if (Math.abs(endAngle) + Math.abs(startAngle) >= 360)
        endAngle = 360 - Math.abs(this.startAngle) - 0.1;
      const elPath = graphics.drawPath({
        d: "",
        stroke: pathFill,
        strokeWidth: strokeWidth * parseInt(trackConfig.strokeWidth, 10) / 100,
        fill: "none",
        strokeOpacity: trackConfig.opacity,
        classes: "apexcharts-radialbar-area"
      });
      if (trackConfig.dropShadow.enabled) {
        const shadow = trackConfig.dropShadow;
        filters.dropShadow(elPath, shadow);
      }
      elRadialBarTrack.add(elPath);
      elPath.attr("id", "apexcharts-radialbarTrack-" + i);
      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: 0,
        dur: 0,
        isTrack: true
      });
    }
    return g2;
  }
  /**
   * @param {Record<string, any>} opts
   */
  drawArcs(opts) {
    var _a;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    const filters = new Filters(this.w);
    const g2 = graphics.group();
    const strokeWidth = this.getStrokeWidth(opts);
    opts.size = opts.size - strokeWidth / 2;
    let hollowFillID = w2.config.plotOptions.radialBar.hollow.background;
    const hollowSize = opts.size - strokeWidth * opts.series.length - this.margin * opts.series.length - strokeWidth * parseInt(w2.config.plotOptions.radialBar.track.strokeWidth, 10) / 100 / 2;
    const hollowRadius = hollowSize - w2.config.plotOptions.radialBar.hollow.margin;
    if (w2.config.plotOptions.radialBar.hollow.image !== void 0) {
      hollowFillID = this.drawHollowImage(opts, g2, hollowSize, hollowFillID);
    }
    const elHollow = this.drawHollow({
      size: hollowRadius,
      centerX: opts.centerX,
      centerY: opts.centerY,
      fill: hollowFillID ? hollowFillID : "transparent"
    });
    if (w2.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
      const shadow = w2.config.plotOptions.radialBar.hollow.dropShadow;
      filters.dropShadow(elHollow, shadow);
    }
    let shown = 1;
    if (!this.radialDataLabels.total.show && w2.seriesData.series.length > 1) {
      shown = 0;
    }
    let dataLabels = null;
    if (this.radialDataLabels.show) {
      const dataLabelsGroup = w2.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      );
      dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.radialDataLabels,
        {
          hollowSize,
          centerX: opts.centerX,
          centerY: opts.centerY,
          opacity: shown
        }
      );
    }
    if (w2.config.plotOptions.radialBar.hollow.position === "back") {
      g2.add(elHollow);
      if (dataLabels) {
        g2.add(dataLabels);
      }
    }
    let reverseLoop = false;
    if (w2.config.plotOptions.radialBar.inverseOrder) {
      reverseLoop = true;
    }
    const morphActive = ((_a = this.ctx.morphTypeChange) == null ? void 0 : _a.isActive()) === true;
    for (let i = reverseLoop ? opts.series.length - 1 : 0; reverseLoop ? i >= 0 : i < opts.series.length; reverseLoop ? i-- : i++) {
      const elRadialBarArc = graphics.group({
        class: `apexcharts-series apexcharts-radial-series`,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[i])
      });
      g2.add(elRadialBarArc);
      elRadialBarArc.attr({
        rel: i + 1,
        "data:realIndex": i
      });
      Series.addCollapsedClassToSeries(this.w, elRadialBarArc, i);
      opts.size = opts.size - strokeWidth - this.margin;
      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: opts.size,
        value: opts.series[i]
      });
      const startAngle = this.startAngle;
      let prevStartAngle;
      const rb = w2.config.plotOptions.radialBar;
      const domainMin = typeof rb.min === "number" ? rb.min : 0;
      const domainMax = typeof rb.max === "number" ? rb.max : 100;
      const domainSpan = domainMax === domainMin ? 1 : domainMax - domainMin;
      const valueToFraction = (v2) => {
        const clamped = Math.min(Math.max(v2, domainMin), domainMax);
        return Math.max(0, (clamped - domainMin) / domainSpan);
      };
      const dataValue = valueToFraction(Utils.negToZero(opts.series[i]));
      let endAngle = Math.round(this.totalAngle * dataValue) + this.startAngle;
      let prevEndAngle;
      if (w2.globals.dataChanged) {
        prevStartAngle = this.startAngle;
        prevEndAngle = Math.round(
          this.totalAngle * valueToFraction(Utils.negToZero(w2.globals.previousPaths[i]))
        ) + prevStartAngle;
      }
      const currFullAngle = Math.abs(endAngle) + Math.abs(startAngle);
      if (currFullAngle > 360) {
        endAngle = endAngle - 0.01;
      }
      const prevFullAngle = Math.abs(prevEndAngle) + Math.abs(prevStartAngle);
      if (prevFullAngle > 360) {
        prevEndAngle = prevEndAngle - 0.01;
      }
      const angle = endAngle - startAngle;
      const dashArray = Array.isArray(w2.config.stroke.dashArray) ? w2.config.stroke.dashArray[i] : w2.config.stroke.dashArray;
      const morphFrom = morphActive ? this.ctx.morphTypeChange.getInitialPathFor(i, 0) : null;
      const morphFromType = morphActive ? this.ctx.morphTypeChange.getFromType() : null;
      const morphFromFilled = !!morphFrom && (morphFromType === "bar" || morphFromType === "funnel" || morphFromType === "pyramid" || morphFromType === "pie" || morphFromType === "donut" || morphFromType === "polarArea");
      const elPath = graphics.drawPath({
        d: morphFrom || "",
        stroke: morphFromFilled ? "transparent" : opts.skipValueArc ? "transparent" : pathFill,
        strokeWidth: morphFromFilled ? 0 : opts.skipValueArc ? 0 : strokeWidth,
        fill: morphFromFilled ? pathFill : "none",
        fillOpacity: w2.config.fill.opacity,
        classes: "apexcharts-radialbar-area apexcharts-radialbar-slice-" + i,
        strokeDashArray: dashArray
      });
      const radialMidAngle = startAngle + angle / 2;
      const radialArcCenter = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        opts.size,
        radialMidAngle
      );
      Graphics.setAttrs(elPath.node, {
        "data:angle": angle,
        "data:value": opts.series[i],
        "data:cx": radialArcCenter.x,
        "data:cy": radialArcCenter.y
      });
      if (w2.config.chart.dropShadow.enabled) {
        const shadow = w2.config.chart.dropShadow;
        filters.dropShadow(elPath, shadow, i);
      }
      filters.setSelectionFilter(elPath, 0, i);
      this.addListeners(elPath, this.radialDataLabels);
      elRadialBarArc.add(elPath);
      elPath.attr({
        index: 0,
        j: i
      });
      if (this.barLabels.enabled) {
        const barStartCords = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          opts.size,
          startAngle
        );
        const text = this.barLabels.formatter(w2.seriesData.seriesNames[i], {
          seriesIndex: i,
          w: w2
        });
        const classes = ["apexcharts-radialbar-label"];
        if (!this.barLabels.onClick) {
          classes.push("apexcharts-no-click");
        }
        let textColor = this.barLabels.useSeriesColors ? w2.globals.colors[i] : w2.config.chart.foreColor;
        if (!textColor) {
          textColor = w2.config.chart.foreColor;
        }
        const x = barStartCords.x + this.barLabels.offsetX;
        const y = barStartCords.y + this.barLabels.offsetY;
        const elText = graphics.drawText({
          x,
          y,
          text,
          textAnchor: "end",
          dominantBaseline: "middle",
          fontFamily: this.barLabels.fontFamily,
          fontWeight: this.barLabels.fontWeight,
          fontSize: this.barLabels.fontSize,
          foreColor: textColor,
          cssClass: classes.join(" ")
        });
        elText.on("click", this.onBarLabelClick);
        elText.attr({
          rel: i + 1
        });
        if (startAngle !== 0) {
          elText.attr({
            "transform-origin": `${x} ${y}`,
            transform: `rotate(${startAngle} 0 0)`
          });
        }
        elRadialBarArc.add(elText);
      }
      let dur = 0;
      if (this.initialAnim && !w2.globals.resized && !w2.globals.dataChanged) {
        dur = w2.config.chart.animations.speed;
      }
      if (w2.globals.dataChanged) {
        dur = w2.config.chart.animations.dynamicAnimation.speed;
      }
      this.animDur = dur / (opts.series.length * 1.2) + this.animDur;
      this.animBeginArr.push(this.animDur);
      if (morphActive && morphFrom) {
        const morphSpeed = this.ctx.morphTypeChange.getSpeed();
        const actualArcD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: opts.size
        });
        if (morphFromFilled) {
          const targetD = this.ctx.morphTypeChange.buildRingSegmentPath(
            opts.centerX,
            opts.centerY,
            opts.size,
            strokeWidth,
            startAngle,
            startAngle + angle
          );
          elPath.animate(morphSpeed).plot(targetD, "polygons").after(
            /** @this {any} */
            function() {
              this.attr({
                d: actualArcD,
                fill: "none",
                stroke: opts.skipValueArc ? "transparent" : pathFill,
                "stroke-width": opts.skipValueArc ? 0 : strokeWidth
              });
            }
          );
        } else {
          elPath.animate(morphSpeed).plot(actualArcD, "polygons").attr({ "stroke-width": strokeWidth });
        }
      } else {
        this.animatePaths(elPath, {
          centerX: opts.centerX,
          centerY: opts.centerY,
          endAngle,
          startAngle,
          prevEndAngle,
          prevStartAngle,
          size: opts.size,
          i,
          totalItems: 2,
          animBeginArr: this.animBeginArr,
          dur,
          shouldSetPrevPaths: true
        });
      }
    }
    return {
      g: g2,
      elHollow,
      dataLabels
    };
  }
  /**
   * Map a domain value (between `min` and `max`) to the corresponding angle
   * in the gauge's `startAngle`..`endAngle` range. Values outside the
   * domain are clamped.
   *
   * @param {number} value
   * @returns {number}
   */
  _angleAtValue(value) {
    const rb = this.w.config.plotOptions.radialBar;
    const min = typeof rb.min === "number" ? rb.min : 0;
    const max = typeof rb.max === "number" ? rb.max : 100;
    const safeMax = max === min ? min + 1 : max;
    const clamped = Math.max(min, Math.min(safeMax, Number(value)));
    const t = (clamped - min) / (safeMax - min);
    return this.startAngle + t * (this.endAngle - this.startAngle);
  }
  /**
   * Build an SVG arc path from `startAngle` to `endAngle` at radius `r`
   * around `(cx, cy)`. Angles are in degrees, with 0° at the top.
   * Used by drawBands; mirrors the `M ... A ... ` form used elsewhere.
   *
   * @param {number} cx
   * @param {number} cy
   * @param {number} r
   * @param {number} startAngle
   * @param {number} endAngle
   * @returns {string}
   */
  _describeArc(cx, cy, r, startAngle, endAngle) {
    const start = Utils.polarToCartesian(cx, cy, r, endAngle);
    const end = Utils.polarToCartesian(cx, cy, r, startAngle);
    const sweep = endAngle - startAngle;
    const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
  }
  /**
   * Draw threshold bands as colored arc segments along the gauge arc.
   * Bands sit behind the value-arc and tick marks. Used for gauges that
   * indicate ranges like 0-30 critical / 30-70 warning / 70-100 healthy.
   *
   * @param {Record<string, any>} opts
   */
  drawBands(opts) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const rb = w2.config.plotOptions.radialBar;
    const bands = rb.bands || [];
    const g2 = graphics.group({
      class: "apexcharts-gauge-bands"
    });
    const strokeWidth = this.getStrokeWidth(opts);
    const radius = opts.size - strokeWidth / 2 - strokeWidth - this.margin;
    const bandStroke = strokeWidth * parseInt(rb.bandsStyle.strokeWidth, 10) / 100;
    const min = typeof rb.min === "number" ? rb.min : 0;
    const max = typeof rb.max === "number" ? rb.max : 100;
    const gapDeg = max === min ? 0 : (rb.bandsStyle.gap || 0) * ((this.endAngle - this.startAngle) / (max - min));
    for (let b2 = 0; b2 < bands.length; b2++) {
      const band = bands[b2];
      if (band.from === void 0 || band.to === void 0) continue;
      const a1 = this._angleAtValue(band.from);
      const a2 = this._angleAtValue(band.to);
      const startA = Math.min(a1, a2) + gapDeg / 2;
      const endA = Math.max(a1, a2) - gapDeg / 2;
      if (endA - startA <= 0) continue;
      const elBand = graphics.drawPath({
        d: this._describeArc(opts.centerX, opts.centerY, radius, startA, endA),
        stroke: band.color || "#ccc",
        strokeWidth: bandStroke,
        fill: "none",
        strokeLinecap: rb.bandsStyle.linecap || "butt",
        classes: "apexcharts-gauge-band"
      });
      elBand.node.setAttribute("data-band-index", String(b2));
      g2.add(elBand);
    }
    return g2;
  }
  /**
   * Draw tick marks (major + minor) along the gauge arc, with optional
   * value labels at each major tick.
   *
   * @param {Record<string, any>} opts
   */
  drawTicks(opts) {
    var _a, _b, _c, _d;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const rb = w2.config.plotOptions.radialBar;
    const ticks = rb.ticks;
    const g2 = graphics.group({ class: "apexcharts-gauge-ticks" });
    const strokeWidth = this.getStrokeWidth(opts);
    const radius = opts.size - strokeWidth / 2 - strokeWidth - this.margin;
    const min = typeof rb.min === "number" ? rb.min : 0;
    const max = typeof rb.max === "number" ? rb.max : 100;
    const majorCount = Math.max(2, (_b = (_a = ticks.major) == null ? void 0 : _a.count) != null ? _b : 11);
    const minorCount = Math.max(0, (_d = (_c = ticks.minor) == null ? void 0 : _c.count) != null ? _d : 0);
    const drawTickAt = (value, cfg, isMajor) => {
      var _a2, _b2, _c2;
      const angle = this._angleAtValue(value);
      const length = (_a2 = cfg.length) != null ? _a2 : 8;
      const inner = cfg.placement === "inside" ? radius - length : radius;
      const outer = cfg.placement === "inside" ? radius : radius + length;
      const p1 = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        inner,
        angle
      );
      const p2 = Utils.polarToCartesian(
        opts.centerX,
        opts.centerY,
        outer,
        angle
      );
      const line = graphics.drawLine(
        p1.x,
        p1.y,
        p2.x,
        p2.y,
        cfg.color || (isMajor ? "#666" : "#999"),
        0,
        cfg.width || (isMajor ? 2 : 1)
      );
      g2.add(line);
      if (isMajor && ((_b2 = ticks.labels) == null ? void 0 : _b2.show)) {
        const labelRadius = (cfg.placement === "inside" ? inner : outer) + (cfg.placement === "inside" ? -1 : 1) * ((_c2 = ticks.labels.offset) != null ? _c2 : 6);
        const labelPos = Utils.polarToCartesian(
          opts.centerX,
          opts.centerY,
          labelRadius,
          angle
        );
        const labelText = typeof ticks.labels.formatter === "function" ? ticks.labels.formatter(value) : String(value);
        const elText = graphics.drawText({
          x: labelPos.x,
          y: labelPos.y,
          text: labelText,
          textAnchor: "middle",
          dominantBaseline: "middle",
          fontFamily: ticks.labels.fontFamily,
          fontSize: ticks.labels.fontSize,
          fontWeight: ticks.labels.fontWeight,
          foreColor: ticks.labels.color,
          cssClass: "apexcharts-gauge-tick-label"
        });
        g2.add(elText);
      }
    };
    for (let m2 = 0; m2 < majorCount; m2++) {
      const t = m2 / (majorCount - 1);
      const value = min + t * (max - min);
      drawTickAt(value, ticks.major || {}, true);
      if (m2 < majorCount - 1 && minorCount > 0) {
        for (let n = 1; n <= minorCount; n++) {
          const tMinor = (m2 + n / (minorCount + 1)) / (majorCount - 1);
          const minorValue = min + tMinor * (max - min);
          drawTickAt(minorValue, ticks.minor || {}, false);
        }
      }
    }
    return g2;
  }
  /**
   * Draw a rotating needle pointing at the current series value. Only
   * called when `plotOptions.radialBar.shape === 'needle'`. The needle is
   * a tapered polygon inside a `<g>` whose rotation transform is animated
   * from `startAngle` to the value's angle.
   *
   * Renders a single needle for the first series value (gauge use case).
   * Additional series are ignored — drilled-down multi-series gauges are
   * out of scope for this iteration.
   *
   * @param {Record<string, any>} opts
   */
  drawNeedle(opts) {
    var _a, _b, _c, _d, _e;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    const rb = w2.config.plotOptions.radialBar;
    const cfg = rb.needle || {};
    const g2 = graphics.group({ class: "apexcharts-gauge-needle" });
    if (!opts.series || opts.series.length === 0) return g2;
    const strokeWidth = this.getStrokeWidth(opts);
    const arcRadius = opts.size - strokeWidth / 2 - strokeWidth - this.margin;
    const length = typeof cfg.length === "string" && cfg.length.endsWith("%") ? arcRadius * parseInt(cfg.length, 10) / 100 : Number(cfg.length || arcRadius * 0.85);
    const baseW = (_a = cfg.baseWidth) != null ? _a : 4;
    const tipW = (_b = cfg.tipWidth) != null ? _b : 1;
    const color = cfg.color || "#333";
    const cx = opts.centerX;
    const needleOffsetY = Number((_c = cfg.offsetY) != null ? _c : 0);
    const cy = opts.centerY + needleOffsetY;
    const path = `M ${cx + baseW / 2} ${cy} A ${baseW / 2} ${baseW / 2} 0 0 1 ${cx - baseW / 2} ${cy} L ${cx - tipW / 2} ${cy - length} L ${cx + tipW / 2} ${cy - length} Z`;
    const elNeedle = graphics.drawPath({
      d: path,
      stroke: color,
      strokeWidth: 0,
      fill: color,
      classes: "apexcharts-gauge-needle-shape"
    });
    g2.add(elNeedle);
    const value = Number(opts.series[0]);
    const targetAngle = this._angleAtValue(value);
    const isInitialMount = this.initialAnim && !w2.globals.dataChanged && !w2.globals.resized;
    const ctx = (
      /** @type {any} */
      this.ctx
    );
    const fromAngle = typeof ctx._lastNeedleAngle === "number" ? ctx._lastNeedleAngle : this.startAngle;
    ctx._lastNeedleAngle = targetAngle;
    const shouldAnimate = Environment.isBrowser() && w2.globals.shouldAnimate && (isInitialMount || w2.globals.dataChanged);
    if (shouldAnimate && fromAngle !== targetAngle) {
      const node = g2.node;
      node.setAttribute("transform-origin", `${cx} ${cy}`);
      node.setAttribute("transform", `rotate(${fromAngle})`);
      const speed = ((_d = cfg.animation) == null ? void 0 : _d.duration) && Number(cfg.animation.duration) || cfg.animationSpeed && Number(cfg.animationSpeed) || ((_e = w2.config.chart.animations.dynamicAnimation) == null ? void 0 : _e.speed) || w2.config.chart.animations.speed || 800;
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const easeOutBack2 = (t) => 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      const easeOutCubic2 = (t) => 1 - Math.pow(1 - t, 3);
      const ease = isInitialMount ? easeOutBack2 : easeOutCubic2;
      if (w2.globals.radialNeedleRAF != null) {
        BrowserAPIs.cancelAnimationFrame(w2.globals.radialNeedleRAF);
        w2.globals.radialNeedleRAF = null;
      }
      const startAt = performance.now();
      const step = (now) => {
        if (this.w.globals.isDestroyed) {
          w2.globals.radialNeedleRAF = null;
          return;
        }
        const t = Math.max(0, Math.min(1, (now - startAt) / speed));
        const angle = fromAngle + (targetAngle - fromAngle) * ease(t);
        node.setAttribute("transform", `rotate(${angle})`);
        if (t < 1) {
          w2.globals.radialNeedleRAF = BrowserAPIs.requestAnimationFrame(step);
        } else {
          w2.globals.radialNeedleRAF = null;
        }
      };
      w2.globals.radialNeedleRAF = BrowserAPIs.requestAnimationFrame(step);
    } else {
      g2.attr({
        "transform-origin": `${cx} ${cy}`,
        transform: `rotate(${targetAngle})`
      });
    }
    return g2;
  }
  /**
   * @param {Record<string, any>} opts
   */
  drawHollow(opts) {
    var _a;
    const graphics = new Graphics(this.w);
    const hollow = this.w.config.plotOptions.radialBar.hollow;
    const circle = graphics.drawCircle(opts.size * 2);
    const attrs = {
      class: "apexcharts-radialbar-hollow",
      cx: opts.centerX,
      cy: opts.centerY,
      r: opts.size,
      fill: opts.fill
    };
    if (hollow.stroke || hollow.strokeDasharray) {
      attrs.stroke = hollow.stroke || "transparent";
      attrs["stroke-width"] = (_a = hollow.strokeWidth) != null ? _a : 1;
      if (hollow.strokeDasharray) {
        attrs["stroke-dasharray"] = hollow.strokeDasharray;
      }
    }
    circle.attr(attrs);
    return circle;
  }
  /**
   * @param {Record<string, any>} opts
   * @param {any} g
   * @param {number} hollowSize
   * @param {string} hollowFillID
   */
  drawHollowImage(opts, g2, hollowSize, hollowFillID) {
    const w2 = this.w;
    const fill = new Fill(this.w);
    const randID = Utils.randomId();
    const hollowFillImg = w2.config.plotOptions.radialBar.hollow.image;
    if (w2.config.plotOptions.radialBar.hollow.imageClipped) {
      fill.clippedImgArea({
        width: hollowSize,
        height: hollowSize,
        image: hollowFillImg,
        patternID: `pattern${w2.globals.cuid}${randID}`
      });
      hollowFillID = `url(#pattern${w2.globals.cuid}${randID})`;
    } else {
      const imgWidth = w2.config.plotOptions.radialBar.hollow.imageWidth;
      const imgHeight = w2.config.plotOptions.radialBar.hollow.imageHeight;
      if (imgWidth === void 0 && imgHeight === void 0) {
        const image = w2.dom.Paper.image(
          hollowFillImg,
          /** @this {any} */
          function(loader) {
            this.move(
              opts.centerX - loader.width / 2 + w2.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY - loader.height / 2 + w2.config.plotOptions.radialBar.hollow.imageOffsetY
            );
          }
        );
        g2.add(image);
      } else {
        const image = w2.dom.Paper.image(
          hollowFillImg,
          /** @this {any} */
          function() {
            this.move(
              opts.centerX - imgWidth / 2 + w2.config.plotOptions.radialBar.hollow.imageOffsetX,
              opts.centerY - imgHeight / 2 + w2.config.plotOptions.radialBar.hollow.imageOffsetY
            );
            this.size(imgWidth, imgHeight);
          }
        );
        g2.add(image);
      }
    }
    return hollowFillID;
  }
  /**
   * @param {Record<string, any>} opts
   */
  getStrokeWidth(opts) {
    const w2 = this.w;
    return opts.size * (100 - parseInt(w2.config.plotOptions.radialBar.hollow.size, 10)) / 100 / (opts.series.length + 1) - this.margin;
  }
  /**
   * @param {Event} e
   */
  onBarLabelClick(e) {
    var _a;
    const target = (
      /** @type {Element} */
      e.target
    );
    const seriesIndex = parseInt((_a = target.getAttribute("rel")) != null ? _a : "", 10) - 1;
    const legendClick = this.barLabels.onClick;
    const w2 = this.w;
    if (legendClick) {
      legendClick(w2.seriesData.seriesNames[seriesIndex], { w: w2, seriesIndex });
    }
  }
}
class RangeBar extends Bar {
  /**
   * @param {any[]} series
   * @param {number} seriesIndex
   */
  draw(series, seriesIndex) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    this.rangeBarOptions = this.w.config.plotOptions.rangeBar;
    this.series = series;
    this.seriesRangeStart = w2.rangeData.seriesRangeStart;
    this.seriesRangeEnd = w2.rangeData.seriesRangeEnd;
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: "apexcharts-rangebar-series apexcharts-plot-series"
    });
    for (let i = 0; i < series.length; i++) {
      let x, y;
      const realIndex = w2.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      const elSeries = graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[realIndex]),
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
        w2.globals.seriesYAxisReverseMap[realIndex][0];
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
      for (let j = 0; j < w2.globals.dataPoints; j++) {
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
        if (w2.config.plotOptions.bar.rangeBarGroupRows) {
          seriesLen = 1;
        }
        if (typeof /** @type {Record<string,any>} */
        ((_e = w2.config.series[i].data) == null ? void 0 : _e[j]) === "undefined") {
          break;
        }
        if (this.isHorizontal) {
          barYPosition = y + barHeight * /** @type {any} */
          this.visibleI;
          const srty = (yDivision - barHeight * seriesLen) / 2;
          if (
            /** @type {Record<string,any>} */
            (_g = (_f = w2.config.series[i].data) == null ? void 0 : _f[j]) == null ? void 0 : _g.x
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
          if (w2.axisFlags.isXNumeric) {
            x = (w2.seriesData.seriesX[i][j] - w2.globals.minX) / this.xRatio - barWidth / 2;
          }
          barXPosition = x + barWidth * /** @type {any} */
          this.visibleI;
          const srtx = (xDivision - barWidth * seriesLen) / 2;
          if (
            /** @type {Record<string,any>} */
            (_i = (_h = w2.config.series[i].data) == null ? void 0 : _h[j]) == null ? void 0 : _i.x
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
          lineFill: pathFill.useRangeColor ? pathFill.color : w2.globals.stroke.colors[realIndex],
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
    const w2 = this.w;
    let overlaps = [];
    const rangeName = (_b = (_a = w2.globals.seriesRangeName) == null ? void 0 : _a[i]) == null ? void 0 : _b[j];
    const x = (
      /** @type {Record<string,any>} */
      (_d = (_c = w2.config.series[i].data) == null ? void 0 : _c[j]) == null ? void 0 : _d.x
    );
    const labelX = Array.isArray(x) ? x.join(" ") : x;
    const rowIndex = w2.labelData.labels.map((_) => Array.isArray(_) ? _.join(" ") : _).indexOf(labelX);
    const overlappedIndex = w2.rangeData.seriesRange[i].findIndex(
      (tx) => {
        var _a2;
        return tx.x === labelX && ((_a2 = tx.overlaps) == null ? void 0 : _a2.size) > 0;
      }
    );
    if (this.isHorizontal) {
      if (w2.config.plotOptions.bar.rangeBarGroupRows) {
        barYPosition = srty + yDivision * rowIndex;
      } else {
        barYPosition = srty + barHeight * this.visibleI + yDivision * rowIndex;
      }
      if (overlappedIndex > -1 && !w2.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = Array.from(
          /** @type {any} */
          w2.rangeData.seriesRange[i][overlappedIndex].overlaps
        );
        if (overlaps.indexOf(rangeName) > -1) {
          barHeight = initPositions.barHeight / overlaps.length;
          barYPosition = barHeight * this.visibleI + yDivision * (100 - parseInt(this.barOptions.barHeight, 10)) / 100 / 2 + barHeight * (this.visibleI + overlaps.indexOf(rangeName)) + yDivision * rowIndex;
        }
      }
    } else {
      if (rowIndex > -1 && !w2.labelData.timescaleLabels.length) {
        if (w2.config.plotOptions.bar.rangeBarGroupRows) {
          barXPosition = srtx + xDivision * rowIndex;
        } else {
          barXPosition = srtx + barWidth * this.visibleI + xDivision * rowIndex;
        }
      }
      if (overlappedIndex > -1 && !w2.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = Array.from(
          /** @type {any} */
          w2.rangeData.seriesRange[i][overlappedIndex].overlaps
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
    const w2 = this.w;
    const { i, j, realIndex, translationsIndex } = indexes;
    const yRatio = this.yRatio[translationsIndex];
    const range = this.getRangeValue(realIndex, j);
    let y1 = Math.min(range.start, range.end);
    let y2 = Math.max(range.start, range.end);
    if (typeof /** @type {any} */
    ((_a = this.series[i]) == null ? void 0 : _a[j]) === "undefined" || /** @type {any} */
    ((_b = this.series[i]) == null ? void 0 : _b[j]) === null) {
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
      w: w2
    });
    if (!w2.axisFlags.isXNumeric) {
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
    const w2 = this.w;
    if (val < 0) {
      val = 0;
    }
    if (val > w2.layout.gridWidth) {
      val = w2.layout.gridWidth;
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
    const w2 = this.w;
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
      w: w2
    });
    if (!w2.axisFlags.isXNumeric) {
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
   * @param {number} i
   * @param {number} j
   */
  getRangeValue(i, j) {
    const w2 = this.w;
    return {
      start: w2.rangeData.seriesRangeStart[i][j],
      end: w2.rangeData.seriesRangeEnd[i][j]
    };
  }
}
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
      const w2 = row[i] / areaHeight;
      coords.push([subX, yoffset, subX + w2, yoffset + areaHeight]);
      subX += w2;
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
function computeArea(node) {
  const kids = node.children;
  if (kids && kids.length) {
    let s = 0;
    for (let i = 0; i < kids.length; i++) {
      s += computeArea(kids[i]);
    }
    node._area = s;
    return s;
  }
  const v2 = Number(node.value);
  const a = isNaN(v2) ? 0 : Math.abs(v2);
  node._area = a;
  return a;
}
function layoutLevel(nodes, xoffset, yoffset, width, height, depth, padding, header) {
  const n = nodes.length;
  if (n === 0 || width <= 0 || height <= 0) return;
  const areas = new Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    areas[i] = nodes[i]._area;
    total += areas[i];
  }
  if (total <= 0) return;
  const rects = squarify(
    normalize(areas, width * height),
    xoffset,
    yoffset,
    width,
    height
  );
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    const r = rects[i];
    if (!r) continue;
    node.rect = r;
    node.depth = depth;
    const kids = node.children;
    if (!kids || !kids.length) continue;
    const rw = r[2] - r[0];
    const rh = r[3] - r[1];
    let pad = Math.max(0, padding(node, depth, rw, rh) || 0);
    if (pad * 2 >= rw || pad * 2 >= rh) pad = 0;
    let head = Math.max(0, header(node, depth, rw, rh) || 0);
    if (head > 0 && rh - pad * 2 - head < head) head = 0;
    node.headerHeight = head;
    layoutLevel(
      kids,
      r[0] + pad,
      r[1] + head + pad,
      rw - pad * 2,
      rh - head - pad * 2,
      depth + 1,
      padding,
      header
    );
  }
}
function generateNested(nodes, width, height, opts = {}) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes || [];
  const padding = opts.padding || (() => 0);
  const header = opts.header || (() => 0);
  for (let i = 0; i < nodes.length; i++) computeArea(nodes[i]);
  layoutLevel(nodes, 0, 0, width, height, 0, padding, header);
  return nodes;
}
const TreemapSquared = { generate, generateNested };
function drilldownById(w2, id) {
  const dd = w2.config.drilldown;
  const list = dd && Array.isArray(dd.series) ? dd.series : [];
  return list.find((s) => s && s.id === id);
}
function toNode(w2, d, i, paletteFromParent, parentKey, seenIds = null, opts = {}) {
  var _a, _b, _c;
  const isObj = d && typeof d === "object";
  const name = isObj ? (_b = (_a = d.x) != null ? _a : d.name) != null ? _b : "" : "";
  const value = isObj ? Number((_c = d.y) != null ? _c : d.value) : Number(d);
  const node = {
    name: String(name),
    value: isNaN(value) ? null : value,
    color: isObj && d.color ? d.color : void 0,
    // Identity across data updates: the path of names (indexed so same-named
    // siblings stay distinct). Update animations morph matched keys in place.
    _key: `${parentKey}/${i}:${name}`
  };
  if (paletteFromParent && !node.color) {
    node.color = paletteFromParent[i % paletteFromParent.length];
  }
  if (opts.keepDatum) node._datum = d;
  if (isObj && Array.isArray(d.children) && d.children.length) {
    node.children = d.children.map(
      (c, j) => toNode(w2, c, j, null, node._key, seenIds, opts)
    );
  } else if (isObj && d.drilldown != null && opts.expandDrilldown !== false) {
    const visited = seenIds || /* @__PURE__ */ new Set();
    if (!visited.has(d.drilldown)) {
      const dd = drilldownById(w2, d.drilldown);
      if (dd && Array.isArray(dd.data) && dd.data.length) {
        const nextSeen = new Set(visited);
        nextSeen.add(d.drilldown);
        const palette = Array.isArray(dd.colors) ? dd.colors : null;
        node.children = dd.data.map(
          (c, j) => toNode(w2, c, j, palette, node._key, nextSeen, opts)
        );
      }
    }
  }
  return node;
}
function buildHierarchy(w2, opts = {}) {
  const cfgSeries = (
    /** @type {any} */
    w2.config.series
  );
  const first = cfgSeries && cfgSeries[0];
  const data = first && Array.isArray(first.data) ? first.data : cfgSeries;
  if (!Array.isArray(data)) return [];
  return data.map(
    (d, i) => toNode(w2, d, i, null, "", null, opts)
  );
}
function buildSeriesRoots(w2, series, opts = {}) {
  const cfgSeries = (
    /** @type {any} */
    series || w2.config.series
  );
  if (!Array.isArray(cfgSeries)) return [];
  return cfgSeries.map((s, i) => {
    var _a, _b;
    const data = s && Array.isArray(s.data) ? s.data : [];
    const key = `${i}:${(_a = s == null ? void 0 : s.name) != null ? _a : ""}`;
    const root = {
      name: String((_b = s == null ? void 0 : s.name) != null ? _b : ""),
      value: null,
      color: (s == null ? void 0 : s.color) || void 0,
      _key: key,
      _seriesIndex: i,
      children: data.map(
        (d, j) => toNode(w2, d, j, null, key, null, opts)
      )
    };
    return root;
  });
}
function fillValues(node) {
  if (node.children && node.children.length) {
    node.children.forEach((c) => fillValues(c));
    if (node.value == null || isNaN(node.value)) {
      node.value = node.children.reduce(
        (s, c) => s + Math.max(0, c.value || 0),
        0
      );
    }
  }
  if (node.value == null || isNaN(node.value)) node.value = 0;
}
function morphKey(key) {
  if (typeof key !== "string") return "";
  const i = key.indexOf("/");
  return i === -1 ? "" : key.slice(i);
}
function annotate(roots) {
  const leaves = [];
  let maxDepth = 0;
  roots.forEach((root, si) => {
    const seriesLeaves = [];
    const walk = (node, depth, parent) => {
      node._parent = parent;
      node._depth = depth;
      node._si = si;
      node._leaf = !(node.children && node.children.length);
      if (depth > maxDepth) maxDepth = depth;
      if (node._leaf) {
        node._di = seriesLeaves.length;
        seriesLeaves.push(node);
      } else {
        node._di = -1;
        node.children.forEach(
          (c) => walk(c, depth + 1, node)
        );
      }
    };
    walk(root, 0, null);
    leaves.push(seriesLeaves);
  });
  return { leaves, maxDepth };
}
function getTreemapRoots(w2) {
  const stashed = w2.globals.treemapRoots;
  if (stashed && stashed.length) {
    return {
      roots: stashed,
      maxDepth: w2.globals.treemapMaxDepth || 1,
      nested: true
    };
  }
  const roots = buildSeriesRoots(w2, w2.config.series, {
    keepDatum: true,
    expandDrilldown: false
  });
  roots.forEach(fillValues);
  const { maxDepth } = annotate(roots);
  return { roots, maxDepth, nested: false };
}
const areaOf = (r) => (r[2] - r[0]) * (r[3] - r[1]);
class TreemapChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.ctx = ctx;
    this.w = w2;
    this.strokeWidth = this.w.config.stroke.width;
    this.helpers = new TreemapHelpers(w2, ctx);
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation;
    this.labels = [];
    this.roots = [];
    this.drawn = [];
    this.nested = false;
    this.showParents = false;
    this.scale = null;
    this._levelCache = null;
    this._total = null;
    this._avgLabelSize = null;
    this._tooltipEl = null;
    this._tipOwned = false;
    this._morphLeafIndex = 0;
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    var _a;
    const w2 = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const fill = new Fill(this.w);
    const ret = graphics.group({
      class: "apexcharts-treemap"
    });
    if (w2.globals.noData) return ret;
    series.forEach((s) => {
      s.map((v2) => {
        return Math.abs(v2);
      });
    });
    this.negRange = this.helpers.checkColorRange();
    w2.config.series.forEach((s, i) => {
      s.data.forEach((l) => {
        if (!Array.isArray(this.labels[i])) this.labels[i] = [];
        this.labels[i].push(l.x);
      });
    });
    const tree = getTreemapRoots(w2);
    this.nested = tree.nested;
    this.roots = tree.roots;
    this.scale = buildContinuousScale(w2);
    const drawn = tree.roots.length === 1 ? tree.roots[0].children || [] : tree.roots;
    this.drawn = drawn;
    const parentsCfg = w2.config.plotOptions.treemap.parents;
    this.showParents = parentsCfg.show === true || parentsCfg.show !== false && this.nested;
    const focus = this._resolveFocus(drawn);
    const layoutRoots = focus ? [focus] : drawn;
    TreemapSquared.generateNested(
      layoutRoots,
      w2.layout.gridWidth,
      w2.layout.gridHeight,
      {
        padding: (node, depth, rw, rh) => this.showParents ? this._levelPadding(depth, rw, rh) : 0,
        header: (node, depth, rw, rh) => this.showParents ? this._levelHeader(node, depth, rw, rh) : 0
      }
    );
    const morphSrc = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange;
    const morphActive = !!morphSrc && typeof morphSrc.isActive === "function" && morphSrc.isActive() && typeof morphSrc.getInitialPathAt === "function";
    this._morphLeafIndex = 0;
    const leavesBySeries = this._leavesBySeries(layoutRoots, w2.config.series.length);
    const parentsBySeries = this.showParents ? this._parentsBySeries(layoutRoots, w2.config.series.length) : [];
    leavesBySeries.forEach((node, i) => {
      var _a2;
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-treemap-series`,
        seriesName: Utils.escapeString(w2.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      graphics.setupEventDelegation(elSeries, ".apexcharts-treemap-rect");
      if (w2.config.chart.dropShadow.enabled) {
        const shadow = w2.config.chart.dropShadow;
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
      if (this.showParents) {
        (parentsBySeries[i] || []).forEach((p2) => {
          this._drawParent(elSeries, p2, i);
        });
      }
      const animCfg = w2.config.chart.animations;
      const gradCfg = animCfg.animateGradually;
      const cascadeEnabled = gradCfg && gradCfg.enabled !== false;
      const cascadeDelays = new Array(node.length).fill(0);
      if (cascadeEnabled) {
        const tileCount = node.length || 1;
        const baseDelay = Math.min(
          gradCfg.delay || 0,
          animCfg.speed * 0.5 / tileCount
        );
        const ranked = node.map(
          /** @param {any} leaf @param {number} k */
          (leaf, k) => ({ j: k, area: leaf.rect ? areaOf(leaf.rect) : 0 })
        ).sort(
          /** @param {{j: number, area: number}} a @param {{j: number, area: number}} b */
          (a, b2) => b2.area - a.area
        );
        ranked.forEach(
          /** @param {{j: number, area: number}} item @param {number} rank */
          (item, rank) => {
            cascadeDelays[item.j] = rank * baseDelay;
          }
        );
      }
      node.forEach((leaf, k) => {
        const r = leaf.rect;
        if (!r) return;
        const j = leaf._di;
        const x1 = r[0];
        const y1 = r[1];
        const x2 = r[2];
        const y2 = r[3];
        bounds.xMin = Math.min(bounds.xMin, x1);
        bounds.yMin = Math.min(bounds.yMin, y1);
        bounds.xMax = Math.max(bounds.xMax, x2);
        bounds.yMax = Math.max(bounds.yMax, y2);
        const colorProps = this._leafColor(i, j);
        const color = colorProps.color;
        const pathFill = fill.fillPath({
          color,
          seriesNumber: i,
          dataPointIndex: j
        });
        const morphFrom = morphActive ? this._morphSourceForLeaf(leaf) : null;
        const elRect = morphFrom ? graphics.drawPath({
          d: this._tilePath(x1, y1, x2, y2),
          fill: "#fff",
          stroke: w2.config.plotOptions.treemap.useFillColorAsStroke ? color : w2.globals.stroke.colors[i],
          strokeWidth: this.strokeWidth,
          fillOpacity: 1
        }) : graphics.drawRect(
          x1,
          y1,
          x2 - x1,
          y2 - y1,
          w2.config.plotOptions.treemap.borderRadius,
          "#fff",
          1,
          this.strokeWidth,
          w2.config.plotOptions.treemap.useFillColorAsStroke ? color : w2.globals.stroke.colors[i]
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
        elRect.node.setAttribute("data:key", morphKey(leaf._key));
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
        if (morphFrom) {
          this._morphTile(
            elRect,
            morphFrom,
            this._tilePath(x1, y1, x2, y2),
            this.ctx.morphTypeChange.getSpeed(),
            i,
            j
          );
        } else if (w2.config.chart.animations.enabled && !w2.globals.dataChanged) {
          let speed = 1;
          if (!w2.globals.resized) {
            speed = w2.config.chart.animations.speed;
          }
          this.animateTreemap(
            elRect,
            fromRect,
            toRect,
            speed,
            // Ranked by draw order, not by data index — the cascade is about
            // what is on screen.
            cascadeDelays[k] || 0
          );
        }
        if (w2.globals.dataChanged) {
          let speed = 1;
          if (this.dynamicAnim.enabled && w2.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed;
            if (w2.globals.previousPaths[i] && /** @type {Record<string,any>} */
            w2.globals.previousPaths[i][j] && /** @type {Record<string,any>} */
            w2.globals.previousPaths[i][j].rect) {
              fromRect = /** @type {Record<string,any>} */
              w2.globals.previousPaths[i][j].rect;
            }
            this.animateTreemap(elRect, fromRect, toRect, speed);
          }
        }
        let fontSize = this.getFontSize(r);
        if (w2.config.plotOptions.treemap.dataLabels.format === "truncate") {
          fontSize = parseInt(String(w2.config.dataLabels.style.fontSize), 10);
        }
        let dataLabels = null;
        if (w2.config.dataLabels.enabled && this._labelCanShow(fontSize, x2 - x1, y2 - y1)) {
          let formattedText = w2.config.dataLabels.formatter(this.labels[i][j], {
            value: w2.seriesData.series[i][j],
            seriesIndex: i,
            dataPointIndex: j,
            w: w2
          });
          if (w2.config.plotOptions.treemap.dataLabels.format === "truncate") {
            formattedText = this.truncateLabels(
              String(formattedText),
              fontSize,
              x1,
              y1,
              x2,
              y2
            );
          }
          if (w2.seriesData.series[i][j]) {
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
          if (w2.config.dataLabels.enabled && dataLabels) {
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
        }
        elSeries.add(elRect);
        if (dataLabels !== null) {
          elSeries.add(dataLabels);
        }
      });
      const seriesTitle = w2.config.plotOptions.treemap.seriesTitle;
      if (!this.showParents && w2.config.series.length > 1 && seriesTitle && seriesTitle.show) {
        const sName = (
          /** @type {Record<string,any>} */
          w2.config.series[i].name || ""
        );
        if (sName && bounds.xMin < Infinity && bounds.yMin < Infinity) {
          const {
            offsetX,
            offsetY,
            borderColor,
            borderWidth,
            borderRadius,
            style
          } = seriesTitle;
          const textColor = style.color || w2.config.chart.foreColor;
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
            y: labelY + padding.top + ((_a2 = textSize == null ? void 0 : textSize.height) != null ? _a2 : 0) * 0.75,
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
    this._renderBreadcrumb();
    return ret;
  }
  // ----------------------------------------------------------------- levels
  /**
   * Per-level config: `plotOptions.treemap.parents` is the base, and
   * `plotOptions.treemap.levels[depth]` overrides it. Depth 0 is the outermost
   * group actually drawn (the series, unless a single series was unwrapped).
   * @param {number} depth
   * @returns {any}
   */
  _levelCfg(depth) {
    if (!this._levelCache) this._levelCache = [];
    if (this._levelCache[depth]) return this._levelCache[depth];
    const tm = this.w.config.plotOptions.treemap;
    const base = tm.parents || {};
    const lvl = (tm.levels || [])[depth] || {};
    const merged = __spreadProps(__spreadValues(__spreadValues({}, base), lvl), {
      header: __spreadProps(__spreadValues(__spreadValues({}, base.header || {}), lvl.header || {}), {
        style: __spreadValues(__spreadValues({}, (base.header || {}).style || {}), (lvl.header || {}).style || {})
      }),
      hover: __spreadValues(__spreadValues({}, base.hover || {}), lvl.hover || {})
    });
    this._levelCache[depth] = merged;
    return merged;
  }
  /**
   * The inset between a parent's edge and its children, at this depth.
   * @param {number} depth
   * @param {number} _rw
   * @param {number} _rh
   * @returns {number}
   */
  _levelPadding(depth, _rw, _rh) {
    const cfg = this._levelCfg(depth);
    return Number(cfg.padding) || 0;
  }
  /**
   * The header strip height at this depth, or 0 when the tile is too small to
   * carry one. The geometry library clamps against its own box; this is the
   * legibility rule, which needs the font size and so lives here.
   * @param {any} node
   * @param {number} depth
   * @param {number} rw
   * @param {number} rh
   * @returns {number}
   */
  _levelHeader(node, depth, rw, rh) {
    const cfg = this._levelCfg(depth);
    const header = cfg.header || {};
    if (header.show === false) return 0;
    const h = Number(header.height);
    if (!Number.isFinite(h) || h <= 0) return 0;
    const minWidth = Number(header.minWidth) || 40;
    if (rw < minWidth) return 0;
    if (rh < h * 2) return 0;
    return h;
  }
  // ------------------------------------------------------------------ nodes
  /**
   * Leaves of the drawn tree, bucketed by the series they came from and kept in
   * depth-first order.
   * @param {any[]} roots
   * @param {number} seriesCount
   * @returns {any[][]}
   */
  _leavesBySeries(roots, seriesCount) {
    const out = new Array(Math.max(1, seriesCount));
    for (let i = 0; i < out.length; i++) out[i] = [];
    const walk = (node) => {
      if (node.children && node.children.length) {
        node.children.forEach(walk);
      } else {
        const si = node._si || 0;
        if (out[si]) out[si].push(node);
      }
    };
    roots.forEach(walk);
    return out;
  }
  /**
   * Non-leaf nodes of the drawn tree, bucketed by series, shallowest first so a
   * container is painted before anything nested inside it.
   * @param {any[]} roots
   * @param {number} seriesCount
   * @returns {any[][]}
   */
  _parentsBySeries(roots, seriesCount) {
    const out = new Array(Math.max(1, seriesCount));
    for (let i = 0; i < out.length; i++) out[i] = [];
    const walk = (node) => {
      if (!node.children || !node.children.length) return;
      const si = node._si || 0;
      if (out[si]) out[si].push(node);
      node.children.forEach(walk);
    };
    roots.forEach(walk);
    out.forEach(
      (list) => list.sort(
        (a, b2) => (a.depth || 0) - (b2.depth || 0)
      )
    );
    return out;
  }
  // ---------------------------------------------------------------- colours
  /**
   * A leaf's fill.
   *
   * Continuous colour (a datum carrying a second metric) takes over when it is
   * configured, because shading a tile by its own area value is precisely what
   * that mode replaces. Everything else - `colorScale.ranges`, `enableShades`,
   * `distributed`, negative handling - is the path it always was.
   *
   * The shape of the return value matches `Helpers.getShadeColor` so the
   * caller cannot tell the two apart.
   *
   * @param {number} i
   * @param {number} j
   * @returns {any}
   */
  _leafColor(i, j) {
    const w2 = this.w;
    if (this.scale) {
      const cv = colorValueOf(w2, i, j);
      if (cv != null) {
        const color = this.scale.at(cv);
        return {
          color,
          // The discrete path has never supplied a label colour, so only the
          // continuous path sets one: a diverging ramp runs right through the
          // middle of the luminance range and a fixed light-or-dark label
          // would be unreadable at one end or the other.
          foreColor: readableOn(color),
          colorProps: { color, foreColor: readableOn(color), percent: 0 }
        };
      }
    }
    return this.helpers.getShadeColor(
      w2.config.chart.type,
      i,
      j,
      this.negRange
    );
  }
  // ---------------------------------------------------------------- parents
  /**
   * Resolved container/header colours for a level. Parent marks are chrome, not
   * data, so they default to a neutral tint of the background rather than to a
   * series colour: with continuous colour on the leaves, a coloured container
   * would read as another data value.
   * @param {number} depth
   * @returns {any}
   */
  _parentChrome(depth) {
    const w2 = this.w;
    const cfg = this._levelCfg(depth);
    const dark = w2.config.theme.mode === "dark";
    const header = cfg.header || {};
    const hstyle = header.style || {};
    const step = Math.min(depth, 3);
    const base = dark ? 255 : 0;
    const rgb = `${base},${base},${base}`;
    return {
      fill: cfg.fill || `rgba(${rgb},${(dark ? 0.04 : 0.03) + step * 0.02})`,
      fillOpacity: cfg.fillOpacity == null ? 1 : cfg.fillOpacity,
      borderColor: cfg.borderColor || `rgba(${rgb},${dark ? 0.18 : 0.14})`,
      borderWidth: cfg.borderWidth == null ? 1 : cfg.borderWidth,
      borderRadius: cfg.borderRadius == null ? w2.config.plotOptions.treemap.borderRadius : cfg.borderRadius,
      headerBg: hstyle.background || `rgba(${rgb},${dark ? 0.1 : 0.07})`,
      headerColor: hstyle.color || (dark ? "#e8e8e8" : w2.config.chart.foreColor),
      headerFontSize: hstyle.fontSize || "12px",
      headerFontFamily: hstyle.fontFamily || w2.config.chart.fontFamily,
      headerFontWeight: hstyle.fontWeight == null ? 600 : hstyle.fontWeight,
      hoverColor: cfg.hover && cfg.hover.color || (dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)"),
      hoverWidth: cfg.hover && cfg.hover.width || 2,
      hoverShow: !(cfg.hover && cfg.hover.show === false)
    };
  }
  /**
   * Draw one parent as a real mark: a container rect, and the header strip the
   * layout already reserved room for.
   *
   * The container is `pointer-events: none` over its interior so the tiles
   * inside it keep receiving hover; only the padding gutter and the header
   * strip belong to the parent.
   *
   * @param {any} elSeries
   * @param {any} node
   * @param {number} i seriesIndex
   */
  _drawParent(elSeries, node, i) {
    var _a;
    const r = node.rect;
    if (!r) return;
    const w2 = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const depth = node.depth || 0;
    const cfg = this._levelCfg(depth);
    const chrome = this._parentChrome(depth);
    const x1 = r[0];
    const y1 = r[1];
    const width = r[2] - r[0];
    const height = r[3] - r[1];
    if (width <= 0 || height <= 0) return;
    const elGroup = graphics.group({
      class: "apexcharts-treemap-parent",
      "data:depth": depth,
      "data:name": Utils.escapeString(node.name)
    });
    const key = morphKey(node._key);
    const morphFrom = this._morphKeyed() ? this.ctx.morphTypeChange.getInitialPathForKey(key) : null;
    const elRect = morphFrom ? graphics.drawPath({
      d: this._tilePath(x1, y1, x1 + width, y1 + height),
      fill: chrome.fill,
      stroke: chrome.borderColor,
      strokeWidth: chrome.borderWidth,
      fillOpacity: chrome.fillOpacity
    }) : graphics.drawRect(
      x1,
      y1,
      width,
      height,
      chrome.borderRadius,
      chrome.fill,
      chrome.fillOpacity,
      chrome.borderWidth,
      chrome.borderColor
    );
    elRect.node.classList.add("apexcharts-treemap-parent-rect");
    elRect.node.setAttribute("data:key", key);
    elRect.node.setAttribute("data:depth", String(depth));
    if (morphFrom) {
      this._morphTile(
        elRect,
        morphFrom,
        this._tilePath(x1, y1, x1 + width, y1 + height),
        this.ctx.morphTypeChange.getSpeed(),
        i,
        depth
      );
    }
    elGroup.add(elRect);
    const headerHeight = node.headerHeight || 0;
    let headerText = "";
    if (headerHeight > 0) {
      const header = cfg.header || {};
      const elHeaderRect = graphics.drawRect(
        x1,
        y1,
        width,
        headerHeight,
        0,
        chrome.headerBg,
        1,
        0,
        "transparent"
      );
      elHeaderRect.node.classList.add("apexcharts-treemap-parent-header");
      elGroup.add(elHeaderRect);
      let text = String((_a = node.name) != null ? _a : "");
      if (typeof header.formatter === "function") {
        text = String(
          header.formatter(node.name, {
            value: node.value,
            depth,
            seriesIndex: i,
            node,
            w: w2
          })
        );
      } else if (header.showValue) {
        text = `${text}  ${this._formatValue(node.value)}`;
      }
      headerText = text;
      const offsetX = Number(header.offsetX) || 0;
      const align = header.align || "left";
      const pad = 6;
      const maxWidth = Math.max(0, width - pad * 2 - Math.abs(offsetX));
      const fontSize = parseFloat(String(chrome.headerFontSize)) || 12;
      const clipped = graphics.getTextBasedOnMaxWidth({
        text,
        maxWidth,
        fontSize
      });
      if (clipped) {
        let tx = x1 + pad + offsetX;
        let anchor = "start";
        if (align === "center") {
          tx = x1 + width / 2 + offsetX;
          anchor = "middle";
        } else if (align === "right") {
          tx = x1 + width - pad + offsetX;
          anchor = "end";
        }
        const elText = graphics.drawText({
          x: tx,
          y: y1 + headerHeight / 2 + fontSize / 3 + (Number(header.offsetY) || 0),
          text: clipped,
          textAnchor: anchor,
          fontSize: chrome.headerFontSize,
          fontFamily: chrome.headerFontFamily,
          fontWeight: chrome.headerFontWeight,
          foreColor: chrome.headerColor,
          cssClass: `apexcharts-treemap-parent-label ${header.style && header.style.cssClass || ""}`
        });
        elText.node.setAttribute("pointer-events", "none");
        elGroup.add(elText);
      }
      this._attachParentEvents(elHeaderRect.node, node, chrome, elRect);
      this._makeParentAccessible(
        elHeaderRect.node,
        node,
        chrome,
        elRect,
        headerText
      );
    }
    this._attachParentEvents(elRect.node, node, chrome, elRect);
    elGroup.node.setAttribute("role", "group");
    elGroup.node.setAttribute("aria-label", this._parentLabel(node, headerText));
    elSeries.add(elGroup);
  }
  /**
   * The spoken description of a branch: what it is, how big, and how much of
   * the chart it accounts for.
   *
   * Starts from the header's own rendered text when there is one (before
   * clipping), so the accessible name contains the visible label rather than a
   * differently-formatted number - a formatter that renders "$3.25T" must not
   * be announced as "3246".
   *
   * @param {any} node
   * @param {string} [visibleText] the header text, formatter applied, unclipped
   * @returns {string}
   */
  _parentLabel(node, visibleText) {
    const total = this._drawnTotal();
    const pct = total > 0 ? (node._area / total * 100).toFixed(1) : "0";
    const n = this._countLeaves(node);
    const lead = visibleText && String(visibleText).trim() ? String(visibleText).replace(/\s+/g, " ").trim() : `${node.name}, ${this._formatValue(node._area)}`;
    return `${lead}, ${n} ${n === 1 ? "item" : "items"}, ${pct}% of total`;
  }
  /**
   * Make a branch reachable and operable from the keyboard.
   *
   * Only the header strip takes focus, and only while click-to-zoom is live: a
   * treemap can hold hundreds of tiles, and making every mark a tab stop would
   * bury the chart's own controls behind a few hundred presses. Tabbing the
   * groups and pressing Enter is the same path the mouse takes, and the
   * breadcrumb is already real buttons, so the way back is reachable too.
   *
   * @param {any} el
   * @param {any} node
   * @param {any} chrome
   * @param {any} elRect
   * @param {string} [visibleText] the header's rendered text, unclipped
   */
  _makeParentAccessible(el, node, chrome, elRect, visibleText) {
    if (!el || !el.setAttribute) return;
    if (!this._zoomEnabled()) return;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute(
      "aria-label",
      `${this._parentLabel(node, visibleText)}. Zoom in`
    );
    el.setAttribute("aria-expanded", "false");
    if (!Environment.isBrowser() || !el.addEventListener) return;
    el.addEventListener("focus", () => {
      elRect.node.setAttribute("stroke", chrome.hoverColor);
      elRect.node.setAttribute("stroke-width", String(chrome.hoverWidth + 1));
    });
    el.addEventListener("blur", () => {
      elRect.node.setAttribute("stroke", chrome.borderColor);
      elRect.node.setAttribute("stroke-width", String(chrome.borderWidth));
    });
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      e.preventDefault();
      this._zoomTo(node, true);
    });
  }
  /**
   * Hover outline, aggregate tooltip and click-to-zoom for a parent mark.
   * @param {any} el the element receiving the pointer
   * @param {any} node
   * @param {any} chrome
   * @param {any} elRect the container rect to outline
   */
  _attachParentEvents(el, node, chrome, elRect) {
    if (!Environment.isBrowser() || !el || !el.addEventListener) return;
    const w2 = this.w;
    if (chrome.hoverShow) {
      el.addEventListener("mouseenter", () => {
        elRect.node.setAttribute("stroke", chrome.hoverColor);
        elRect.node.setAttribute("stroke-width", String(chrome.hoverWidth));
      });
      el.addEventListener("mouseleave", () => {
        elRect.node.setAttribute("stroke", chrome.borderColor);
        elRect.node.setAttribute("stroke-width", String(chrome.borderWidth));
      });
    }
    if (w2.config.tooltip.enabled) {
      el.addEventListener(
        "mouseenter",
        (e) => this._showParentTooltip(e, node)
      );
      el.addEventListener(
        "mousemove",
        (e) => this._positionTooltip(e)
      );
      el.addEventListener("mouseleave", () => this._hideParentTooltip());
    }
    if (this._zoomEnabled()) {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => this._zoomTo(node));
    }
  }
  // ------------------------------------------------------------------- zoom
  /**
   * Click-to-zoom is live only when nothing else already owns the click.
   *
   * The drilldown feature is the other way into a hierarchy on a treemap, and
   * the two are different models of the same gesture: drilldown replaces the
   * view one level at a time, zoom reframes a tree that stays whole. Running
   * both would fight over the same click and over the one breadcrumb slot in
   * the wrap, so drilldown wins where it is active and this stands down.
   * @returns {boolean}
   */
  _zoomEnabled() {
    const w2 = this.w;
    const z = w2.config.plotOptions.treemap.zoom;
    if (!z || !z.enabled || !this.showParents) return false;
    const dd = w2.config.drilldown;
    if (dd && dd.enabled && Array.isArray(dd.series) && dd.series.length) {
      if (!this._warnedZoomConflict) {
        this._warnedZoomConflict = true;
        console.warn(
          "ApexCharts treemap: `plotOptions.treemap.zoom` and the drilldown feature both navigate the hierarchy, so zoom is ignored here. Drop `drilldown.series` to zoom a nested treemap instead."
        );
      }
      return false;
    }
    return true;
  }
  /**
   * The focused branch for this render, looked up by the key stashed on the
   * last click. Keys are rebuilt identically from the same data, so the focus
   * survives a re-render; a key that no longer resolves (the data changed under
   * it) simply falls back to the whole tree.
   * @param {any[]} drawn
   * @returns {any}
   */
  _resolveFocus(drawn) {
    const key = this.w.globals.treemapFocusKey;
    if (!key || !this._zoomEnabled()) return null;
    let found = null;
    const walk = (node) => {
      if (found) return;
      if (node._key === key) {
        found = node;
        return;
      }
      if (node.children) node.children.forEach(walk);
    };
    drawn.forEach(walk);
    return found && found.children && found.children.length ? found : null;
  }
  /**
   * @param {any} node
   * @param {boolean} [restoreFocus] move focus into the new view once it is
   *   drawn. A zoom re-renders the chart, which destroys the element the
   *   keyboard user was standing on; without this they would be returned to the
   *   top of the document.
   */
  _zoomTo(node, restoreFocus = false) {
    const w2 = this.w;
    if (!node || !node.children || !node.children.length) return;
    const next = w2.globals.treemapFocusKey === node._key ? null : node._key;
    w2.globals.treemapFocusKey = next;
    this._hideParentTooltip();
    const done = this.ctx.update();
    if (!restoreFocus || !done || typeof done.then !== "function") return;
    done.then(() => {
      if (!Environment.isBrowser()) return;
      const crumb = (
        /** @type {any} */
        w2.dom.baseEl.querySelector(
          ".apexcharts-breadcrumb .apexcharts-breadcrumb-item"
        )
      );
      if (crumb && crumb.focus) {
        crumb.focus();
        return;
      }
      const header = (
        /** @type {any} */
        w2.dom.baseEl.querySelector(
          ".apexcharts-treemap-parent-header[tabindex]"
        )
      );
      if (header && header.focus) header.focus();
    });
  }
  /**
   * Outermost drawn group -> focus chain, for the breadcrumb.
   *
   * Stops at a drawn root rather than walking all the way to `_parent === null`:
   * when a single series was unwrapped, the series node is still every level-0
   * node's parent, and it is not a level the reader ever sees.
   */
  _focusChain() {
    const chain = [];
    const drawnRoots = new Set(this.drawn || []);
    let n = this._resolveFocus(this.drawn || []);
    while (n) {
      chain.unshift(n);
      if (drawnRoots.has(n)) break;
      n = n._parent;
    }
    return chain;
  }
  /** The breadcrumb config: a treemap-local override on the shared block. */
  _breadcrumbCfg() {
    const z = this.w.config.plotOptions.treemap.zoom;
    return breadcrumbConfig(this.w, z && z.breadcrumb);
  }
  /**
   * Breadcrumb back out of a zoom. Markup, config and accessible semantics are
   * the shared ones, so a zoomed treemap and a drilled-in chart present the
   * same affordance.
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return;
    const w2 = this.w;
    if (!w2.dom.elWrap) return;
    clearBreadcrumb(w2);
    if (!this._zoomEnabled()) return;
    const chain = this._focusChain();
    if (!chain.length) return;
    const nav = renderBreadcrumb(w2, {
      ariaLabel: "Treemap breadcrumb",
      config: this._breadcrumbCfg(),
      compact: true,
      crumbs: [{ label: "All", data: null }].concat(
        chain.map((n) => ({ label: n.name, data: n }))
      ),
      onNavigate: (_i, crumb) => {
        w2.globals.treemapFocusKey = crumb.data ? crumb.data._key : null;
        this._hideParentTooltip();
        this.ctx.update();
      }
    });
    if (!nav) return;
    this._placeBreadcrumb(nav);
    avoidChromeOverlap(w2, nav);
  }
  /**
   * Sit the breadcrumb in the band the layout reserved for it
   * (Dimensions.gridPadForBreadcrumb), just above the grid.
   *
   * The fallback below should never fire: the reserve is unconditional once
   * zoom is enabled. It stays for the cases the reserve cannot cover - a
   * responsive override that turns zoom on after layout, or a host stylesheet
   * that grows the font - where a readable chip over the tiles beats a
   * breadcrumb clipped by the plot.
   *
   * @param {any} nav
   */
  _placeBreadcrumb(nav) {
    var _a, _b;
    const w2 = this.w;
    const gridTop = w2.layout.translateY || 0;
    const dimHelpers = (_b = (_a = this.ctx) == null ? void 0 : _a.dimensions) == null ? void 0 : _b.dimHelpers;
    const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
    const navH = nav.getBoundingClientRect().height || BREADCRUMB_HEIGHT;
    if (gridTop - titleArea >= navH + 1) {
      nav.style.top = `${gridTop - navH - 1}px`;
      return;
    }
    nav.style.top = `${titleArea}px`;
    const dark = w2.config.theme.mode === "dark";
    nav.style.background = dark ? "rgba(20,24,30,0.82)" : "rgba(255,255,255,0.86)";
    nav.style.borderRadius = "4px";
  }
  // ---------------------------------------------------------------- tooltip
  /**
   * A parent is not a row in the series matrix, so the shared tooltip - which
   * addresses everything by (seriesIndex, dataPointIndex) - has nothing to look
   * up. It writes into the same tooltip element instead, so the aggregate looks
   * like every other tooltip in the chart.
   * @param {MouseEvent} e
   * @param {any} node
   */
  _showParentTooltip(e, node) {
    const w2 = this.w;
    const t = this._tip();
    if (!t) return;
    const total = this._drawnTotal();
    const parentVal = node._parent ? node._parent._area : total;
    const pctTotal = total > 0 ? (node._area / total * 100).toFixed(1) : "0.0";
    const pctParent = parentVal > 0 ? (node._area / parentVal * 100).toFixed(1) : pctTotal;
    const cfg = this.w.config.plotOptions.treemap.parents;
    const custom = cfg && cfg.tooltip && cfg.tooltip.formatter;
    const leafCount = this._countLeaves(node);
    let html;
    if (typeof custom === "function") {
      html = custom({
        name: node.name,
        value: node._area,
        depth: node.depth || 0,
        leafCount,
        percentOfParent: Number(pctParent),
        percentOfTotal: Number(pctTotal),
        node,
        w: w2
      });
    } else {
      const marker = this._parentChrome(node.depth || 0).headerBg;
      const groupBg = w2.config.tooltip.fillSeriesColor ? `background-color:${marker};` : "";
      html = `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}"><div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${Utils.escapeString(
        node.name
      )}: </span><span class="apexcharts-tooltip-text-y-value">${this._formatValue(
        node._area
      )}</span></div><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${leafCount} items, </span><span class="apexcharts-tooltip-text-y-value">${pctParent}% of parent, ${pctTotal}% of total</span></div></div></div>`;
    }
    t.innerHTML = html;
    t.classList.add("apexcharts-active");
    t.style.opacity = "1";
    this._tipOwned = true;
    this._positionTooltip(e);
  }
  /** @returns {any} */
  _tip() {
    if (!this._tooltipEl) {
      this._tooltipEl = this.w.dom.baseEl.querySelector(".apexcharts-tooltip");
    }
    return this._tooltipEl;
  }
  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  _positionTooltip(e) {
    const t = this._tip();
    if (!t || !this._tipOwned) return;
    const rect = this.w.dom.elWrap.getBoundingClientRect();
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    const pad = 12;
    let x = e.clientX - rect.left + pad;
    if (x + tw > rect.width) x = e.clientX - rect.left - tw - pad;
    x = Math.max(0, Math.min(x, rect.width - tw));
    let y = e.clientY - rect.top + pad;
    if (y + th > rect.height) y = e.clientY - rect.top - th - pad;
    y = Math.max(0, Math.min(y, rect.height - th));
    t.style.left = x + "px";
    t.style.top = y + "px";
  }
  _hideParentTooltip() {
    const t = this._tip();
    if (!t || !this._tipOwned) return;
    this._tipOwned = false;
    t.classList.remove("apexcharts-active");
    t.style.opacity = "0";
  }
  /**
   * The whole tree's area, zoomed in or not: "% of total" has to mean the same
   * thing at every zoom level, otherwise the branch you just zoomed into
   * reports 100%.
   * @returns {number}
   */
  _drawnTotal() {
    if (this._total == null) {
      this._total = (this.drawn || []).reduce(
        (s, r) => s + this._subtreeArea(r),
        0
      );
    }
    return this._total || 0;
  }
  /**
   * A node's area, computed the same way the layout does it. Zooming lays out
   * only the focused branch, so every other branch reaches here without the
   * `_area` the layout would otherwise have left on it.
   * @param {any} node
   * @returns {number}
   */
  _subtreeArea(node) {
    if (node._area != null) return node._area;
    const kids = node.children;
    if (kids && kids.length) {
      let s = 0;
      for (let i = 0; i < kids.length; i++) s += this._subtreeArea(kids[i]);
      return s;
    }
    const v2 = Number(node.value);
    return isNaN(v2) ? 0 : Math.abs(v2);
  }
  /**
   * @param {any} node
   * @returns {number}
   */
  _countLeaves(node) {
    if (!node.children || !node.children.length) return 1;
    return node.children.reduce(
      (s, c) => s + this._countLeaves(c),
      0
    );
  }
  /**
   * Format an aggregate the way the chart formats its own y values, so a
   * parent's total reads like the tiles it contains.
   * @param {number} v
   * @returns {string}
   */
  _formatValue(v2) {
    var _a, _b, _c, _d, _e;
    const w2 = this.w;
    const fmt = ((_b = (_a = w2.config.tooltip) == null ? void 0 : _a.y) == null ? void 0 : _b.formatter) || ((_e = (_d = (_c = w2.config.yaxis) == null ? void 0 : _c[0]) == null ? void 0 : _d.labels) == null ? void 0 : _e.formatter);
    if (typeof fmt === "function") {
      try {
        return String(fmt(v2, { seriesIndex: 0, dataPointIndex: 0, w: w2 }));
      } catch (_) {
      }
    }
    return String(v2);
  }
  /**
   * Whether a tile could show a label at all, decided from geometry alone so
   * nothing has to be measured to find out.
   *
   * Two rules, both about legibility rather than about saving work:
   *   - a tile that cannot hold one character in EITHER orientation has no
   *     label to draw, rotated or not
   *   - below `dataLabels.minFontSize` the text is decoration, not information
   *
   * Together these keep a dense treemap from spending its whole render
   * measuring text nobody can read.
   *
   * @param {number} fontSize
   * @param {number} tileWidth
   * @param {number} tileHeight
   * @returns {boolean}
   */
  _labelCanShow(fontSize, tileWidth, tileHeight) {
    if (!Number.isFinite(fontSize) || fontSize <= 0) return false;
    const cfg = this.w.config.plotOptions.treemap.dataLabels;
    const min = cfg && cfg.minFontSize != null ? Number(cfg.minFontSize) : 0;
    if (fontSize < min) return false;
    return Math.max(tileWidth, tileHeight) >= fontSize;
  }
  /**
   * Mean label length across the whole chart.
   *
   * It scales every tile's font size, and it is the same number for all of
   * them, so it is computed once per draw. It used to be recomputed inside
   * `getFontSize`, which runs per tile: two full walks of every label, per
   * label, which is quadratic and was the entire cost of a large treemap (a
   * 10k-tile chart spent ~9s here).
   *
   * @returns {number}
   */
  _averageLabelSize() {
    if (this._avgLabelSize != null) return this._avgLabelSize;
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
    this._avgLabelSize = totalLabelLength(this.labels) / countLabels(this.labels);
    return this._avgLabelSize;
  }
  // This calculates a font-size based upon
  // average label length and the size of the box
  /**
   * @param {number[]} coordinates
   */
  getFontSize(coordinates) {
    const w2 = this.w;
    const averagelabelsize = this._averageLabelSize();
    function fontSize(width, height) {
      const area = width * height;
      const arearoot = Math.pow(area, 0.5);
      return Math.min(
        arearoot / averagelabelsize,
        parseInt(w2.config.dataLabels.style.fontSize, 10)
      );
    }
    return fontSize(
      coordinates[2] - coordinates[0],
      coordinates[3] - coordinates[1]
    );
  }
  /**
   * @param {any} elText
   * @param {string | number} fontSize
   * @param {string} text
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  rotateToFitLabel(elText, fontSize, text, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w);
    const textRect = graphics.getTextRects(text, String(fontSize));
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
  /**
   * @param {string} text
   * @param {number} fontSize
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  truncateLabels(text, fontSize, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w);
    const textRect = graphics.getTextRects(text, String(fontSize));
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
  /**
   * True when the active cross-type morph can pair marks by branch identity
   * rather than by draw order.
   * @returns {boolean}
   */
  _morphKeyed() {
    var _a;
    const m2 = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange;
    return !!(m2 && typeof m2.hasKeyedMarks === "function" && m2.hasKeyedMarks() && typeof m2.getInitialPathForKey === "function");
  }
  /**
   * The captured shape a LEAF tile unrolls from, or null when the outgoing
   * chart had nothing to give it.
   *
   * Branch identity first, so a tile unrolls from the arc that stood for the
   * same row rather than the k-th one. That key can find nothing even when
   * both sides carry keys, and a FLAT treemap taking from a nested sunburst is
   * exactly that case: its tiles are keyed at depth one ('/0:Tops') while the
   * arcs are keyed at the depth they actually sit ('/0:Apparel/0:Tops'), so no
   * key ever matches. Draw order is the fallback, the same one the mirror
   * direction has always had (Sunburst._morphSourceFor), and without it
   * treemap -> sunburst read as a morph while the return trip grew from
   * nothing.
   *
   * Leaves only. A container taking a leaf's path by position would unroll
   * from a different branch entirely, so `_morphParent` stays key-or-nothing.
   *
   * @param {any} leaf
   * @returns {string | null}
   */
  _morphSourceForLeaf(leaf) {
    var _a;
    const morph = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange;
    if (!morph || typeof morph.getInitialPathAt !== "function") return null;
    if (this._morphKeyed()) {
      const keyed = morph.getInitialPathForKey(morphKey(leaf._key));
      if (keyed) return keyed;
    }
    return morph.getInitialPathAt(this._morphLeafIndex++);
  }
  /**
   * A tile as closed path data, for the cross-type morph (a <rect> cannot hold
   * an arc, so a morphing tile is drawn as a <path>).
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @returns {string}
   */
  _tilePath(x1, y1, x2, y2) {
    return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`;
  }
  /**
   * Tween a tile's path data from a captured shape (a sunburst arc) into its
   * rectangle.
   *
   * Routed through Animations.morphSVG, the same call every other morphing
   * renderer makes: it already selects the polygon-resample algorithm while a
   * cross-type morph is active, which is what tweens between shapes as
   * different as an arc and a rectangle. Reaching for the interpolator directly
   * would also add a name to a module the split bundles share, which breaks
   * them.
   *
   * @param {any} el
   * @param {string} fromD
   * @param {string} toD
   * @param {number} speed
   * @param {number} i
   * @param {number} j
   */
  _morphTile(el, fromD, toD, speed, i, j) {
    const animations = new Animations(this.w, this.ctx);
    animations.morphSVG(el, i, j, "none", fromD, toD, speed, 0);
  }
  /**
   * @param {any} el
   * @param {Record<string, any>} fromRect
   * @param {Record<string, any>} toRect
   * @param {number} speed
   * @param {number} [delay] - per-tile cascade delay in ms
   */
  animateTreemap(el, fromRect, toRect, speed, delay = 0) {
    const animations = new Animations(this.w);
    animations.animateRect(
      el,
      fromRect,
      toRect,
      speed,
      () => {
        animations.animationCompleted(el);
      },
      delay
    );
  }
}
const p = 0.05, m = 0.05, g = 1 / 45;
function v(e, t, s, i) {
  const n = { value: e, velocity: 0, target: e, stiffness: t, damping: s };
  return n;
}
function b(e, t) {
  if (t <= 0) return M(e);
  let s = t;
  for (; s > 0; ) {
    const t2 = Math.min(s, g), i = -e.stiffness * (e.value - e.target) - e.damping * e.velocity;
    e.velocity += i * t2, e.value += e.velocity * t2, s -= t2;
  }
  return !!M(e) && (e.value = e.target, e.velocity = 0, true);
}
function w(e, t) {
  e.target = t;
}
function M(e) {
  var _a, _b;
  const t = (_a = e.restVelocity) != null ? _a : p, s = (_b = e.restDisplacement) != null ? _b : m;
  return Math.abs(e.velocity) < t && Math.abs(e.value - e.target) < s;
}
const S = { crisp: [210, 26], gentle: [120, 20], snappy: [320, 30] };
function L(e) {
  var _a;
  return (_a = S[e != null ? e : "crisp"]) != null ? _a : S.crisp;
}
const LAYOUT_KEY = "__apexcharts_unit_layouts__";
if (!/** @type {any} */
globalThis[LAYOUT_KEY]) {
  globalThis[LAYOUT_KEY] = {};
}
function getLayouts() {
  return (
    /** @type {any} */
    globalThis[LAYOUT_KEY]
  );
}
function getUnitLayout(name) {
  if (!name) return null;
  return getLayouts()[name] || null;
}
const MARK_KEY = "__apexcharts_unit_marks__";
if (!/** @type {any} */
globalThis[MARK_KEY]) {
  globalThis[MARK_KEY] = {};
}
function getMarks() {
  return (
    /** @type {any} */
    globalThis[MARK_KEY]
  );
}
function normalizeUnitMark(def, name) {
  if (typeof def === "string") {
    const d = def.trim();
    if (!d) return null;
    return Object.freeze({
      name: "anonymous",
      path: d,
      viewBox: (
        /** @type {[number,number,number,number]} */
        [0, 0, 100, 100]
      )
    });
  }
  if (!def || typeof def !== "object") return null;
  if (typeof def.path !== "string" || !def.path.trim()) return null;
  const vb = Array.isArray(def.viewBox) && def.viewBox.length === 4 ? def.viewBox.map(Number) : [0, 0, 100, 100];
  if (!vb.every((n) => isFinite(n)) || vb[2] <= 0 || vb[3] <= 0) {
    return null;
  }
  return Object.freeze(__spreadProps(__spreadValues({}, def), {
    name: def.name || "anonymous",
    path: def.path.trim(),
    viewBox: (
      /** @type {[number,number,number,number]} */
      /** @type {any} */
      vb
    ),
    fillRule: def.fillRule === "evenodd" ? "evenodd" : void 0
  }));
}
function getUnitMark(name) {
  if (!name) return null;
  return getMarks()[name] || null;
}
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeOutBack(s) {
  return (t) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
const SPRING_REFERENCE_SPEED = 800;
const MAX_FRAME_STEP = 0.25;
const PK_CIRCLE = 0;
const PK_CORNER = 1;
const PK_GLYPH = 2;
function springParams(preset, speed) {
  const [stiffness, damping] = L(
    /** @type {import('apex-commons').SpringPreset|undefined} */
    preset
  );
  const scale = SPRING_REFERENCE_SPEED / Math.max(1, speed);
  return [stiffness * scale * scale, damping * scale];
}
class Unit {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.ctx = ctx;
    this.w = w2;
    this._lastDotR = 1;
    this._gridTrack = null;
    this._gridDenom = 1;
    this._scatterAxis = null;
    this._specCache = /* @__PURE__ */ new Map();
    this._markWarned = null;
  }
  /**
   * @param {any[]} series - flat count array (non-axis / pie-shaped data)
   * @returns {any} the chart's root group element
   */
  draw(series) {
    const w2 = this.w;
    const graphics = new Graphics(w2, this.ctx);
    const ret = graphics.group({ class: "apexcharts-unit" });
    if (w2.globals.noData || !Array.isArray(series) || series.length === 0) {
      return ret;
    }
    const opts = w2.config.plotOptions.unit;
    const layout = opts.layout === "packed" ? "packed" : opts.layout === "columns" ? "columns" : opts.layout === "grid" ? "grid" : opts.layout === "scatter" ? "scatter" : opts.layout === "arc" ? "arc" : opts.layout === "custom" ? "custom" : "grouped";
    const transition = opts.transition;
    const flow = transition === "flow";
    const identity = transition === "identity";
    const unitValue = opts.unitValue > 0 ? opts.unitValue : 1;
    let counts = series.map((v2) => {
      const n = Math.abs(Utils.parseNumber(v2)) / unitValue;
      return n > 0 ? Math.max(1, Math.round(n)) : 0;
    });
    counts = this._applyMaxUnits(counts, opts.maxUnits);
    const total = counts.reduce((a, b2) => a + b2, 0);
    const clusters = layout === "packed" ? this._layoutPacked(counts, opts) : layout === "columns" ? this._layoutColumns(counts, opts) : layout === "grid" ? this._layoutGrid(counts, opts) : layout === "scatter" ? this._layoutScatter(opts) : layout === "arc" ? this._layoutArc(counts, opts) : layout === "custom" ? this._layoutCustom(counts, opts) : this._layoutGrouped(counts, opts);
    const gridSplit = layout === "grid" && !!(opts.grid && opts.grid.split);
    if (gridSplit) this._drawGridTrack(ret, graphics, opts);
    if (layout === "scatter") this._drawScatterAxes(ret, graphics);
    const dotR = this._lastDotR;
    const animate = this._shouldAnimate();
    const morph = this.ctx && this.ctx.morphTypeChange;
    const morphActive = animate && !!morph && typeof morph.isActive === "function" && morph.isActive() && typeof morph.getInitialCenterFor === "function";
    const perRowBurst = morphActive && typeof morph.getInitialSlotFor === "function";
    const pieceTakeover = morphActive && typeof morph.usesPieceTakeover === "function" && morph.usesPieceTakeover();
    const prev = animate && !morphActive && this.ctx ? this.ctx._unitPrevDots : null;
    const nextPrev = /* @__PURE__ */ new Map();
    const animDots = [];
    const unitData = w2.seriesData.unitData || [];
    const sizeStats = this._bubbleStats(unitData, opts, dotR);
    let gIndex = 0;
    clusters.forEach((cluster) => {
      const color = w2.globals.colors[cluster.i] || w2.globals.colors[0] || "#008FFB";
      const elSeries = graphics.group({
        class: "apexcharts-series",
        seriesName: Utils.escapeString(
          w2.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`
        ),
        rel: cluster.i + 1,
        "data:realIndex": cluster.i
      });
      const burst = morphActive && !perRowBurst ? morph.getInitialCenterFor(cluster.i) : null;
      const burstCount = cluster.dots.length;
      const catData = unitData[cluster.i];
      cluster.dots.forEach((d, jj) => {
        const j = d.j != null ? d.j : jj;
        const datum = catData ? catData[j] : void 0;
        const dotFill = datum && typeof datum === "object" && datum.fillColor ? datum.fillColor : color;
        const rj = d.r != null ? d.r : sizeStats ? this._radiusForValue(this._unitValueOf(datum), sizeStats) : dotR;
        const spec = this._markSpecFor(opts, datum, cluster.i, rj);
        const el = this._drawDot(graphics, opts, rj, dotFill, cluster.i, j, spec);
        elSeries.add(el);
        let key;
        if (identity) {
          const id = datum && typeof datum === "object" ? datum.id != null ? datum.id : datum.name : void 0;
          key = id != null ? `id:${id}` : `g:${gIndex}`;
        } else if (flow) {
          key = String(gIndex);
        } else if (d.slot != null) {
          key = `slot:${d.slot}`;
        } else {
          key = `${cluster.i}:${j}`;
        }
        gIndex++;
        nextPrev.set(key, { x: d.x, y: d.y, fill: dotFill, r: rj, spec });
        if (pieceTakeover) {
          this._place(el.node, spec, d.x, d.y);
          el.node.setAttribute("opacity", "0");
          el.node.setAttribute("data-piece-hidden", "1");
        } else if (animate) {
          const from = prev && prev.get(key);
          const anchor = from || (perRowBurst ? morph.getInitialSlotFor(cluster.i, j, burstCount) : burst);
          const enter = opts.gather && opts.gather.enter || "burst";
          const inPlace = gridSplit || enter === "fade" || enter === "rise";
          const cx0 = anchor ? anchor.x : inPlace ? d.x : cluster.cx;
          const cy0 = anchor ? anchor.y : enter === "rise" && !gridSplit ? d.y + 14 : inPlace ? d.y : cluster.cy;
          el.node.style.opacity = anchor ? "1" : "0";
          this._place(el.node, spec, cx0, cy0);
          animDots.push({
            node: el.node,
            spec,
            x: d.x,
            y: d.y,
            cx0,
            cy0,
            // Carries live spring state (position AND velocity) forward when
            // this render interrupted one still in flight.
            key,
            // Radius tween: an identity-kept dot grows/shrinks from its previous
            // size to its new one (e.g. bubble sizing turning on) instead of
            // snapping. Enters/uniform updates keep r0 === r1 (no-op).
            r0: from && from.r != null ? from.r : rj,
            r1: rj,
            // Colour tween: a dot that flows into a differently coloured group
            // recolours as it travels rather than snapping at the first frame.
            fill0: from ? from.fill : dotFill,
            fill1: dotFill,
            delay: 0,
            // assigned below (staggered by global order)
            isEnter: !anchor
          });
        } else {
          this._place(el.node, spec, d.x, d.y);
        }
      });
      if ((layout === "grouped" || layout === "columns" || gridSplit) && opts.clusterLabels && opts.clusterLabels.show && counts[cluster.i] > 0) {
        const labelTotal = gridSplit ? this._gridDenom : total;
        this._drawClusterLabel(elSeries, cluster, counts[cluster.i], labelTotal, opts, color);
      }
      ret.add(elSeries);
    });
    if (this._outerLabelsOn(opts)) {
      this._drawOuterLabels(ret, clusters, counts, total, opts, animate && !prev);
    }
    if (prev) {
      const exits = this._collectExits(prev, nextPrev, opts);
      if (exits.length) {
        const exitGroup = graphics.group({ class: "apexcharts-unit-exits" });
        ret.add(exitGroup);
        this._runExits(exitGroup, exits, opts);
      }
    }
    if (this.ctx) this.ctx._unitPrevDots = nextPrev;
    if (this.ctx && (!animate || morphActive)) this.ctx._unitSprings = null;
    if (animate && animDots.length) {
      this._runGather(animDots);
    } else {
      w2.globals.animationEnded = true;
    }
    return ret;
  }
  /**
   * Cap total dots to `maxUnits`, scaling every category down proportionally
   * (a non-zero category keeps at least one dot). Warns once when it clips.
   * @param {number[]} counts
   * @param {number} maxUnits
   * @returns {number[]}
   */
  _applyMaxUnits(counts, maxUnits) {
    const total = counts.reduce((a, b2) => a + b2, 0);
    if (!maxUnits || maxUnits <= 0 || total <= maxUnits) return counts;
    const scale = maxUnits / total;
    console.warn(
      `[ApexCharts] unit chart: ${total} dots exceeds maxUnits (${maxUnits}); counts were scaled down proportionally. Raise plotOptions.unit.maxUnits or use plotOptions.unit.unitValue to represent more units per dot.`
    );
    return counts.map((c) => c > 0 ? Math.max(1, Math.round(c * scale)) : 0);
  }
  /**
   * `layout: 'custom'`. Positions come from a caller-supplied provider rather
   * than from a generator in this file.
   *
   * The provider is the whole extension point: `(objects, rect) => [{id, x, y,
   * r?}]`. Everything downstream is unchanged, which is the point - the engine
   * already tweens position, radius and colour, and already keeps a mark's
   * identity across a relayout, so an arbitrary new arrangement needs no new
   * transition code. A silhouette, a hex grid, a timeline, or a projection
   * handed over by ApexMaps are all just this function.
   *
   * Marks the provider omits are dropped, so they animate out through the
   * existing exit path. Ids matching no mark are ignored.
   *
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutCustom(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const total = counts.reduce((a, b2) => a + b2, 0);
    const provider = this._resolveLayoutProvider(opts);
    if (!provider) {
      console.warn(
        `[ApexCharts] unit chart: layout 'custom' needs plotOptions.unit.positions (a function, or the name of a layout registered with ApexCharts.registerUnitLayout). Falling back to 'grouped'.`
      );
      return this._layoutGrouped(counts, opts);
    }
    const gutter = this._outerLabelsOn(opts) ? this._outerLabelGutter(counts, opts) : 0;
    this._lastOuterGutter = gutter;
    const rect = {
      x: gutter,
      y: 0,
      width: Math.max(1, gw - gutter * 2),
      height: gh
    };
    const availR = Math.sqrt(rect.width * rect.height / Math.PI);
    const step = this._resolveStep(opts, availR, total);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const dotR = this._lastDotR;
    const objects = this._layoutObjects(counts, dotR);
    let placed;
    try {
      placed = provider(objects, rect);
    } catch (e) {
      console.warn(
        "[ApexCharts] unit chart: the layout provider threw; falling back to 'grouped'.",
        e
      );
      return this._layoutGrouped(counts, opts);
    }
    if (!Array.isArray(placed)) {
      console.warn(
        "[ApexCharts] unit chart: the layout provider must return an array of {id, x, y}; falling back to 'grouped'."
      );
      return this._layoutGrouped(counts, opts);
    }
    const byId = /* @__PURE__ */ new Map();
    placed.forEach((p2) => {
      if (!p2 || !isFinite(p2.x) || !isFinite(p2.y)) return;
      byId.set(String(p2.id), {
        x: p2.x,
        y: p2.y,
        r: typeof p2.r === "number" && p2.r > 0 ? p2.r : void 0
      });
    });
    const clusters = counts.map((_, i) => ({
      i,
      cx: gw / 2,
      cy: gh / 2,
      outerR: dotR,
      dots: []
    }));
    objects.forEach((o) => {
      const hit = byId.get(o.id);
      if (!hit) return;
      clusters[o.seriesIndex].dots.push({
        x: hit.x,
        y: hit.y,
        r: hit.r,
        j: o.dataPointIndex
      });
    });
    clusters.forEach((c) => {
      if (!c.dots.length) return;
      let sx = 0;
      let sy = 0;
      c.dots.forEach((d) => {
        sx += d.x;
        sy += d.y;
      });
      c.cx = sx / c.dots.length;
      c.cy = sy / c.dots.length;
      let far = 0;
      c.dots.forEach((d) => {
        far = Math.max(far, Math.hypot(d.x - c.cx, d.y - c.cy));
      });
      c.outerR = far + dotR;
    });
    return clusters;
  }
  /**
   * One entry per mark, in global draw order, for a layout provider.
   *
   * `id` is the datum's own id/name where the per-unit object form supplies
   * one, so a provider can address a specific unit ("Texas", "employee 41")
   * rather than a positional slot. It falls back to `"<category>:<index>"`.
   *
   * @param {number[]} counts
   * @param {number} dotR the radius the engine would use, so a provider that
   *   packs by size does not have to rediscover it
   * @returns {{id:string,index:number,seriesIndex:number,dataPointIndex:number,label:string,value:number|undefined,datum:any,r:number}[]}
   */
  _layoutObjects(counts, dotR) {
    const w2 = this.w;
    const unitData = w2.seriesData.unitData || [];
    const names = w2.seriesData.seriesNames || [];
    const objects = [];
    let index = 0;
    counts.forEach((n, i) => {
      var _a;
      const catData = unitData[i];
      for (let j = 0; j < n; j++) {
        const datum = catData ? catData[j] : void 0;
        const id = datum && typeof datum === "object" && (datum.id != null || datum.name != null) ? String(datum.id != null ? datum.id : datum.name) : `${i}:${j}`;
        objects.push({
          id,
          index,
          seriesIndex: i,
          dataPointIndex: j,
          label: names[i],
          // Normalised at the boundary: internally "no value" is null, but the
          // public object shape uses an absent property.
          value: (_a = this._unitValueOf(datum)) != null ? _a : void 0,
          datum,
          r: dotR
        });
        index++;
      }
    });
    return objects;
  }
  /**
   * Resolve `plotOptions.unit.positions` to a provider function: either the
   * function itself, or the name of one registered through
   * `ApexCharts.registerUnitLayout`.
   * @param {any} opts
   * @returns {Function|null}
   */
  _resolveLayoutProvider(opts) {
    const positions = opts.positions;
    if (typeof positions === "function") return positions;
    if (typeof positions === "string" && positions) {
      const found = getUnitLayout(positions);
      if (found) return found;
      console.warn(
        `[ApexCharts] unit chart: no layout named "${positions}" is registered. Register one with ApexCharts.registerUnitLayout("${positions}", fn).`
      );
    }
    return null;
  }
  /**
   * Lay out each category as its own cluster in a horizontal row. All clusters
   * share one dot radius (so dot size is comparable across clusters); the blob
   * radius encodes the count.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutGrouped(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const labelSpace = opts.clusterLabels && opts.clusterLabels.show ? 30 : 6;
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0);
    const Kv = Math.max(1, visible.length);
    const slotOf = new Array(counts.length).fill(-1);
    visible.forEach((i, s) => slotOf[i] = s);
    const cellW = gw / Kv;
    const availH = gh - labelSpace;
    const maxCount = Math.max(1, ...counts);
    const pad = Math.min(cellW, availH) * 0.08;
    const availR = Math.max(4, Math.min(cellW, availH) / 2 - pad);
    const step = this._resolveStep(opts, availR, maxCount);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const dotR = this._lastDotR;
    const cy = labelSpace + availH / 2;
    const outerRs = counts.map((n) => step * Math.sqrt(Math.max(1, n)) + dotR);
    const cellCentre = (i) => slotOf[i] >= 0 ? cellW * (slotOf[i] + 0.5) : gw / 2;
    let centers = counts.map((_, i) => cellCentre(i));
    const visOuter = visible.map((i) => outerRs[i]);
    let overlap = false;
    for (let s = 1; s < Kv; s++) {
      if (centers[visible[s]] - centers[visible[s - 1]] < visOuter[s] + visOuter[s - 1]) {
        overlap = true;
        break;
      }
    }
    if (overlap) {
      const gap = Math.max(2 * dotR, 8);
      const totalW = visOuter.reduce((a, r) => a + 2 * r, 0) + gap * (Kv - 1);
      let visCenters;
      if (totalW <= gw) {
        let x = (gw - totalW) / 2;
        visCenters = visOuter.map((r) => {
          const c = x + r;
          x += 2 * r + gap;
          return c;
        });
      } else if (Kv === 1) {
        visCenters = [gw / 2];
      } else {
        const lo = visOuter[0];
        const hi = gw - visOuter[Kv - 1];
        visCenters = visOuter.map((_, s) => lo + (hi - lo) * s / (Kv - 1));
      }
      centers = counts.map(
        (_, i) => slotOf[i] >= 0 ? visCenters[slotOf[i]] : gw / 2
      );
    }
    return counts.map((n, i) => ({
      i,
      cx: centers[i],
      cy,
      outerR: outerRs[i],
      dots: this._spiral(centers[i], cy, n, step, 0)
    }));
  }
  /**
   * Lay out all categories into ONE packed blob. Dots are assigned spiral
   * indices in category order (smallest-first when sortByGroup), so the
   * minority group nests in the centre.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutPacked(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const labelSpace = 6;
    const total = Math.max(1, counts.reduce((a, b2) => a + b2, 0));
    const availR = Math.max(
      4,
      Math.min(gw, gh - labelSpace) / 2 - Math.min(gw, gh) * 0.06
    );
    const step = this._resolveStep(opts, availR, total);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const cx = gw / 2;
    const cy = labelSpace + (gh - labelSpace) / 2;
    const order = counts.map((_, i) => i);
    if (opts.sortByGroup !== false) {
      order.sort((a, b2) => counts[a] - counts[b2]);
    }
    const clusters = counts.map((_, i) => ({
      i,
      cx,
      cy,
      outerR: step * Math.sqrt(total) + this._lastDotR,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let gi = 0;
    order.forEach((catI) => {
      for (let j = 0; j < counts[catI]; j++) {
        const r = step * Math.sqrt(gi + 0.5);
        const theta = gi * GOLDEN_ANGLE;
        clusters[catI].dots.push({
          x: cx + r * Math.cos(theta),
          y: cy + r * Math.sin(theta),
          slot: gi
        });
        gi++;
      }
    });
    return clusters;
  }
  /**
   * Lay out all marks as a PARLIAMENT / hemicycle: seats in concentric arced
   * rows across an annulus, filled in category (party) order so each category
   * forms a contiguous angular wedge (the classic seating chart). `arc` controls
   * the sweep (`startAngle`/`endAngle`, radialBar convention: 0 = top, clockwise;
   * default a top semicircle), the donut hole (`innerRadiusRatio`) and the row
   * count (`rows`, or 'auto'). Like `packed` this is ONE shared shape coloured by
   * category, so seats key by physical slot: a seat-count change recolours the
   * party boundary in place and only the rim adds / removes seats.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutArc(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const total = Math.max(1, counts.reduce((a, b3) => a + b3, 0));
    const acfg = opts.arc || {};
    const startDeg = typeof acfg.startAngle === "number" ? acfg.startAngle : -90;
    const endDeg = typeof acfg.endAngle === "number" ? acfg.endAngle : 90;
    const a0 = startDeg * Math.PI / 180;
    const a1 = endDeg * Math.PI / 180;
    const span = a1 - a0 || Math.PI;
    const innerRatio = Math.max(
      0,
      Math.min(0.95, typeof acfg.innerRadiusRatio === "number" ? acfg.innerRadiusRatio : 0.4)
    );
    const ux = (a) => Math.sin(a);
    const uy = (a) => -Math.cos(a);
    const b2 = this._arcBounds(a0, a1);
    const pad = Math.min(gw, gh) * 0.04;
    const boxW = Math.max(1e-6, b2.maxX - b2.minX);
    const boxH = Math.max(1e-6, b2.maxY - b2.minY);
    const r1 = Math.max(4, Math.min((gw - 2 * pad) / boxW, (gh - 2 * pad) / boxH));
    const r0 = r1 * innerRatio;
    const cx = gw / 2 - (b2.minX + b2.maxX) / 2 * r1;
    const cy = gh / 2 - (b2.minY + b2.maxY) / 2 * r1;
    const alloc = this._arcAllocate(total, r0, r1, span, opts);
    this._lastDotR = alloc.dotR;
    const seats = [];
    for (let r = 0; r < alloc.R; r++) {
      const rho = alloc.radii[r];
      const n = alloc.seatsPerRow[r];
      for (let k = 0; k < n; k++) {
        const a = n === 1 ? (a0 + a1) / 2 : a0 + span * (k + 0.5) / n;
        seats.push({ a, x: cx + rho * ux(a), y: cy + rho * uy(a) });
      }
    }
    seats.sort((s1, s2) => s1.a - s2.a);
    const clusters = counts.map((_, i) => ({
      i,
      cx,
      cy,
      outerR: r1,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let ci = 0;
    let used = 0;
    seats.forEach((s, slot) => {
      while (ci < counts.length && used >= counts[ci]) {
        ci++;
        used = 0;
      }
      if (ci >= counts.length) return;
      clusters[ci].dots.push({ x: s.x, y: s.y, slot });
      used++;
    });
    return clusters;
  }
  /**
   * Bounding box of the outer arc (radius 1) over [a0, a1], including the centre
   * and every cardinal angle (multiple of 90deg) inside the range, so a
   * semicircle / full circle / arbitrary sweep is all bounded correctly.
   * @param {number} a0 @param {number} a1
   * @returns {{minX:number,maxX:number,minY:number,maxY:number}}
   */
  _arcBounds(a0, a1) {
    const ux = (a) => Math.sin(a);
    const uy = (a) => -Math.cos(a);
    const lo = Math.min(a0, a1);
    const hi = Math.max(a0, a1);
    const xs = [0, ux(a0), ux(a1)];
    const ys = [0, uy(a0), uy(a1)];
    const q = Math.PI / 2;
    for (let k = Math.ceil(lo / q); k * q <= hi; k++) {
      xs.push(ux(k * q));
      ys.push(uy(k * q));
    }
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }
  /**
   * Allocate `total` seats across concentric rows of the annulus [r0, r1] sweeping
   * `span` radians: seats per row are proportional to the row radius (a longer arc
   * holds more), summed EXACTLY to total by largest remainder. Row count is
   * `arc.rows` if given, else derived from a fixed dot size, else auto-searched to
   * maximise the dot radius (the largest dots that still pack without overlap,
   * mirroring `size:'auto'` elsewhere).
   * @param {number} total @param {number} r0 @param {number} r1 @param {number} span @param {any} opts
   * @returns {{R:number, radii:number[], seatsPerRow:number[], dotR:number}}
   */
  _arcAllocate(total, r0, r1, span, opts) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1.05;
    const absSpan = Math.abs(span) || Math.PI;
    const fixed = this._fixedRadius(opts);
    const evalR = (R) => {
      R = Math.max(1, Math.round(R));
      const radii = [];
      for (let r = 0; r < R; r++) {
        radii.push(R === 1 ? (r0 + r1) / 2 : r0 + (r1 - r0) * (r / (R - 1)));
      }
      const weightSum = radii.reduce((a, x) => a + x, 0) || 1;
      const raw = radii.map((rho) => total * rho / weightSum);
      const seatsPerRow = raw.map((x) => Math.floor(x));
      let left = total - seatsPerRow.reduce((a, x) => a + x, 0);
      raw.map((x, idx) => ({ idx, frac: x - Math.floor(x) })).sort((p2, qq) => qq.frac - p2.frac).forEach((o) => {
        if (left > 0) {
          seatsPerRow[o.idx]++;
          left--;
        }
      });
      while (left > 0) {
        seatsPerRow[R - 1]++;
        left--;
      }
      const radialPitch = R === 1 ? r1 - r0 || r1 : (r1 - r0) / (R - 1);
      let minArcPitch = Infinity;
      for (let r = 0; r < R; r++) {
        const n = seatsPerRow[r];
        if (n <= 0) continue;
        const arcPitch = radii[r] * absSpan / n;
        if (arcPitch < minArcPitch) minArcPitch = arcPitch;
      }
      const pitch = Math.min(radialPitch, minArcPitch);
      return { R, radii, seatsPerRow, dotR: Math.max(1, pitch / (2 * spacing)) };
    };
    const arcRows = opts.arc && opts.arc.rows;
    let res;
    if (typeof arcRows === "number" && arcRows >= 1) {
      res = evalR(arcRows);
    } else if (fixed) {
      const pitch = 2 * fixed * spacing;
      res = evalR((r1 - r0) / pitch + 1);
    } else {
      const maxR = Math.max(1, Math.min(40, Math.ceil(Math.sqrt(total)) + 6));
      res = evalR(1);
      for (let R = 2; R <= maxR; R++) {
        const cand = evalR(R);
        if (cand.dotR > res.dotR) res = cand;
      }
    }
    if (fixed) res.dotR = fixed;
    return res;
  }
  /**
   * Lay out each category as a vertical BAR built from stacked dots (a unit /
   * waffle column). Every bar shares one dot size and one width (the same
   * number of dot columns); the bar's HEIGHT encodes its count. Dots fill each
   * bar bottom-up, row by row. This is the "dot bar" state the circle layouts
   * morph into: with `transition:'flow'` the dots glide straight from their
   * circle slots into these bar slots (see the storyboard sample).
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutColumns(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const labelsOn = !!(opts.clusterLabels && opts.clusterLabels.show);
    const labelsBelow = labelsOn && opts.clusterLabels.position === "bottom";
    const topPad = labelsOn && !labelsBelow ? 30 : 6;
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0);
    const Kv = Math.max(1, visible.length);
    const slotOf = new Array(counts.length).fill(-1);
    visible.forEach((i, s) => slotOf[i] = s);
    const cellW = gw / Kv;
    const barW = cellW * 0.62;
    const bottomPad = Math.max(8, gh * 0.04) + (labelsBelow ? 30 : 0);
    const availH = Math.max(4, gh - topPad - bottomPad);
    const maxCount = Math.max(1, ...counts);
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const colSize = opts.columns ? opts.columns.size : void 0;
    let fixed;
    if (opts.shape !== "image" && colSize === "auto") {
      fixed = null;
    } else if (opts.shape !== "image" && typeof colSize === "number" && colSize > 0) {
      fixed = colSize;
    } else {
      fixed = this._fixedRadius(opts);
    }
    let cols = 1;
    let pitch = 0;
    if (fixed) {
      pitch = 2 * fixed * spacing;
      this._lastDotR = fixed;
      const rowsCap = Math.max(1, Math.floor(availH / pitch));
      const maxColsByWidth = Math.max(1, Math.floor(barW / pitch));
      cols = Math.max(1, Math.min(maxColsByWidth, Math.ceil(maxCount / rowsCap)));
    } else {
      let best = 0;
      const maxCols = Math.max(1, Math.min(40, Math.round(barW / 4)));
      for (let c = 1; c <= maxCols; c++) {
        const rows = Math.ceil(maxCount / c);
        const d = Math.min(barW / c, availH / rows);
        if (d > best) {
          best = d;
          cols = c;
        }
      }
      pitch = best;
      this._lastDotR = Math.max(1, pitch / (2 * spacing));
    }
    const r = this._lastDotR;
    const maxRows = Math.ceil(maxCount / cols);
    const tallestBarH = Math.min(availH, maxRows * pitch);
    const bottom = topPad + (availH + tallestBarH) / 2;
    return counts.map((n, i) => {
      const cx = slotOf[i] >= 0 ? cellW * (slotOf[i] + 0.5) : gw / 2;
      const rows = Math.ceil(Math.max(1, n) / cols);
      const barH = rows * pitch;
      const left = cx - cols * pitch / 2 + pitch / 2;
      const dots = [];
      for (let j = 0; j < n; j++) {
        const rowIdx = Math.floor(j / cols);
        const colIdx = j % cols;
        dots.push({
          x: left + colIdx * pitch,
          y: bottom - r - rowIdx * pitch
        });
      }
      return {
        i,
        cx,
        cy: bottom - barH / 2,
        outerR: barH / 2,
        // Flag read by _drawClusterLabel: a bar takes a straight label (above
        // or below per clusterLabels.position), never a curved arc.
        flat: true,
        dots
      };
    });
  }
  /**
   * Lay out ALL categories into ONE regular lattice - a waffle / grid. Dots take
   * sequential slots in DECLARED category order and fill row-major, `columns`
   * wide, so each category owns a contiguous band of cells: a part-to-whole
   * square "pie". `grid.total` (optional) re-allocates the cells to a fixed
   * budget (e.g. 100) by largest remainder, so the grid reads as exact
   * percentages regardless of the raw totals; without it there is one cell per
   * unit (respecting unitValue / maxUnits). `grid.fillFrom` picks the first row.
   * The category bands follow the legend order (no smallest-first sort), and
   * each physical slot is keyed so a proportion change recolours boundary cells
   * in place rather than reshuffling the whole grid.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutGrid(counts, opts) {
    if (opts.grid && opts.grid.split) return this._layoutGridSplit(counts, opts);
    this._gridTrack = null;
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const gcfg = opts.grid || {};
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10));
    const fillFrom = gcfg.fillFrom === "top" ? "top" : "bottom";
    const cells = gcfg.total > 0 ? this._largestRemainder(counts, Math.round(gcfg.total)) : counts.slice();
    const totalCells = cells.reduce((a, b2) => a + b2, 0);
    const rows = Math.max(1, Math.ceil(Math.max(1, totalCells) / cols));
    const labelSpace = 6;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const availW = Math.max(4, gw);
    const availH = Math.max(4, gh - labelSpace);
    const fixed = this._fixedRadius(opts);
    let pitch = 0;
    if (fixed) {
      pitch = 2 * fixed * spacing;
      this._lastDotR = fixed;
    } else {
      pitch = Math.min(availW / cols, availH / rows);
      this._lastDotR = Math.max(1, pitch / (2 * spacing));
    }
    const blockW = cols * pitch;
    const blockH = rows * pitch;
    const originX = (gw - blockW) / 2 + pitch / 2;
    const topY = labelSpace + (availH - blockH) / 2;
    const rowY = (rowIdx) => fillFrom === "bottom" ? topY + blockH - pitch / 2 - rowIdx * pitch : topY + pitch / 2 + rowIdx * pitch;
    const clusters = counts.map((_, i) => ({
      i,
      cx: gw / 2,
      cy: labelSpace + availH / 2,
      outerR: Math.max(blockW, blockH) / 2,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let k = 0;
    for (let ci = 0; ci < cells.length; ci++) {
      for (let j = 0; j < cells[ci]; j++) {
        const col = k % cols;
        const rowIdx = Math.floor(k / cols);
        clusters[ci].dots.push({
          x: originX + col * pitch,
          y: rowY(rowIdx),
          slot: k
        });
        k++;
      }
    }
    return clusters;
  }
  /**
   * Small-multiple ("trellis") waffles: ONE mini-waffle per category, laid out
   * in a near-square grid of tiles. Each tile has `grid.total` cells (default
   * 100 -> a 10x10 tile) and fills a fraction of them equal to the category's
   * value over a denominator (`grid.max`, else the largest count so the leader
   * fills its tile and every other tile stays proportionally full - no empty
   * tiles for arbitrary data). The unfilled cells are drawn as a faint TRACK
   * backdrop (see _drawGridTrack) so each tile reads as a part-to-whole "of N".
   * Only VISIBLE (non-zero) categories claim a tile, so a legend hide drops the
   * tile and the rest re-flow. Each filled cell is keyed by a physical
   * `tile*cells + localCell` slot, so a value change grows/shrinks a tile's fill
   * in place instead of reshuffling.
   * @param {number[]} counts @param {any} opts
   */
  _layoutGridSplit(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const gcfg = opts.grid || {};
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10));
    const fillFrom = gcfg.fillFrom === "top" ? "top" : "bottom";
    const cellsPerTile = Math.max(1, Math.round(gcfg.total > 0 ? gcfg.total : 100));
    const rowsPerTile = Math.max(1, Math.ceil(cellsPerTile / cols));
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0);
    const K = Math.max(1, visible.length);
    const denom = gcfg.max > 0 ? gcfg.max : Math.max(1, ...counts);
    const tileCols = Math.max(
      1,
      Math.round(gcfg.tileColumns > 0 ? gcfg.tileColumns : Math.ceil(Math.sqrt(K)))
    );
    const tileRows = Math.max(1, Math.ceil(K / tileCols));
    const labelsOn = !(opts.clusterLabels && opts.clusterLabels.show === false);
    const labelsBelow = labelsOn && opts.clusterLabels && opts.clusterLabels.position === "bottom";
    const topBand = labelsOn && !labelsBelow ? 22 : 4;
    const botBand = labelsOn && labelsBelow ? 22 : 4;
    const tileW = gw / tileCols;
    const tileH = gh / tileRows;
    const availTileW = Math.max(4, tileW * 0.86);
    const availTileH = Math.max(4, tileH - topBand - botBand);
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const fixed = this._fixedRadius(opts);
    let pitch = 0;
    if (fixed) {
      pitch = 2 * fixed * spacing;
      this._lastDotR = fixed;
    } else {
      pitch = Math.min(availTileW / cols, availTileH / rowsPerTile);
      this._lastDotR = Math.max(1, pitch / (2 * spacing));
    }
    const blockW = cols * pitch;
    const blockH = rowsPerTile * pitch;
    const rowY = (topY, rowIdx) => fillFrom === "bottom" ? topY + blockH - pitch / 2 - rowIdx * pitch : topY + pitch / 2 + rowIdx * pitch;
    const track = [];
    const clusters = [];
    visible.forEach((ci, t) => {
      const tc = t % tileCols;
      const tr = Math.floor(t / tileCols);
      const tileX = tc * tileW;
      const tileYtop = tr * tileH;
      const originX = tileX + (tileW - blockW) / 2 + pitch / 2;
      const topY = tileYtop + topBand + (availTileH - blockH) / 2;
      const cellXY = (k) => ({
        x: originX + k % cols * pitch,
        y: rowY(topY, Math.floor(k / cols))
      });
      for (let k = 0; k < cellsPerTile; k++) track.push(cellXY(k));
      const filled = Math.max(
        0,
        Math.min(cellsPerTile, Math.round(counts[ci] / denom * cellsPerTile))
      );
      const dots = [];
      for (let k = 0; k < filled; k++) {
        const p2 = cellXY(k);
        dots.push({ x: p2.x, y: p2.y, slot: t * cellsPerTile + k });
      }
      clusters.push({
        i: ci,
        cx: tileX + tileW / 2,
        cy: topY + blockH / 2,
        outerR: blockH / 2,
        // Straight per-tile label (never a curved arc), placed by position.
        flat: true,
        split: true,
        dots
      });
    });
    this._gridDenom = denom;
    this._gridTrack = { cells: track };
    return clusters;
  }
  /**
   * Draw the faint "track" backdrop for the small-multiple grid: every cell of
   * every tile's full lattice, so the filled (coloured) cells drawn on top read
   * as a fraction of the whole. Static (redrawn each render, never animated);
   * painted BEHIND the series groups. `grid.trackColor` overrides the default
   * theme-neutral grey.
   * @param {any} ret @param {Graphics} graphics @param {any} opts
   */
  _drawGridTrack(ret, graphics, opts) {
    const track = this._gridTrack;
    if (!track || !track.cells || !track.cells.length) return;
    const r = this._lastDotR;
    const gcfg = opts.grid || {};
    const trackColor = gcfg.trackColor || "rgba(128,128,128,0.14)";
    const g2 = graphics.group({ class: "apexcharts-unit-track" });
    track.cells.forEach((c) => {
      let el;
      if (opts.shape === "square") {
        const side = r * 2;
        el = graphics.drawRect(0, 0, side, side, opts.borderRadius || 0, trackColor, 1, 0, "none");
        el.node.setAttribute("fill", trackColor);
        el.node.setAttribute("x", String(c.x - r));
        el.node.setAttribute("y", String(c.y - r));
      } else {
        el = graphics.drawCircle(r, { fill: trackColor, "stroke-width": 0, stroke: "none" });
        el.node.setAttribute("fill", trackColor);
        el.node.setAttribute("cx", String(c.x));
        el.node.setAttribute("cy", String(c.y));
      }
      el.node.classList.add("apexcharts-unit-track-cell");
      g2.add(el);
    });
    ret.add(g2);
  }
  /**
   * Scatter / beeswarm layout: position every unit on a real numeric X value
   * axis by its own value (`_unitValueOf`), laned by category on Y. Within a
   * lane an anti-overlap "swarm" pack (or a random jitter) spreads the dots off
   * the centre line so equal / close values do not stack on top of each other.
   * This is the unit chart's answer to "put these on axes": one dot per datum,
   * placed by data, with a drawn value axis + category lanes (see
   * _drawScatterAxes). Needs the per-unit object form (each datum a numeric
   * `value`/`y`); flat counts have no per-unit value, so their lanes stay empty.
   * @param {any} opts
   */
  _layoutScatter(opts) {
    const w2 = this.w;
    const scfg = opts.scatter || {};
    if (scfg.y === "value") return this._layoutScatter2D(opts);
    if (scfg.orientation === "vertical") return this._layoutScatterVertical(opts);
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const unitData = w2.seriesData.unitData || [];
    const names = w2.seriesData.seriesNames || [];
    const valueOf = (d) => this._unitValueOf(d);
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const catVals = unitData.map(
      (cat) => Array.isArray(cat) ? cat.map(valueOf) : []
    );
    const isNum = (v2) => v2 != null && isFinite(v2);
    const visible = catVals.map((_, i) => i).filter((i) => catVals[i].some(isNum));
    const Kv = Math.max(1, visible.length);
    let vmin = Infinity;
    let vmax = -Infinity;
    catVals.forEach(
      (vs) => vs.forEach((v2) => {
        if (v2 != null && isFinite(v2)) {
          if (v2 < vmin) vmin = v2;
          if (v2 > vmax) vmax = v2;
        }
      })
    );
    if (vmin === Infinity) {
      vmin = 0;
      vmax = 1;
    }
    const tickAmount = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5));
    const domain = this._scatterValueDomain(scfg, vmin, vmax, tickAmount);
    const xMin = domain.min;
    const xMax = domain.max;
    const xSpan = xMax - xMin || 1;
    const laneW = scfg.laneLabelWidth != null ? Math.max(0, scfg.laneLabelWidth) : Kv > 1 ? 92 : 8;
    const bottomGutter = 30 + (scfg.xTitle ? 20 : 0);
    const plotL = laneW;
    const plotR = gw - 8;
    const plotT = 10;
    const plotB = gh - bottomGutter;
    const plotW = Math.max(4, plotR - plotL);
    const plotH = Math.max(4, plotB - plotT);
    const plotX = (v2) => plotL + (v2 - xMin) / xSpan * plotW;
    const laneH = plotH / Kv;
    const laneCy = (slot) => plotT + laneH * (slot + 0.5);
    let r = 0;
    const fixed = this._fixedRadius(opts);
    if (fixed) {
      r = fixed;
    } else {
      const maxLane = Math.max(
        1,
        ...visible.map((i) => catVals[i].filter(isNum).length)
      );
      r = Math.max(
        2,
        Math.min(6, laneH * 0.12, plotW / (2.5 * Math.sqrt(maxLane)))
      );
    }
    this._lastDotR = r;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const step = Math.max(0.5, r * spacing);
    const jitter = scfg.spread === "jitter";
    const clusters = [];
    const lanes = [];
    const maxR = sizeStats ? sizeStats.rMax : r;
    visible.forEach((ci, slot) => {
      const cy = laneCy(slot);
      lanes.push({ i: ci, cy, name: names[ci] || `series-${ci + 1}` });
      const cat = unitData[ci] || [];
      const pts = cat.map((d, j) => {
        const v2 = valueOf(d);
        const p2 = { j, px: plotX(isNum(v2) ? v2 : xMin), y: cy };
        if (sizeStats) p2.r = this._scatterRadius(d, sizeStats, r);
        return p2;
      });
      if (jitter) {
        const halfLane = Math.max(maxR, laneH / 2 - maxR);
        pts.forEach((p2, k) => {
          const t = (k * 9301 + 49297) % 233280 / 233280;
          p2.y = cy + (t * 2 - 1) * halfLane;
        });
      } else {
        this._beeswarm(pts, cy, r, step, maxR);
      }
      clusters.push({
        i: ci,
        cx: (plotL + plotR) / 2,
        cy,
        outerR: laneH / 2,
        dots: pts.map((p2) => ({ x: p2.px, y: p2.y, r: p2.r }))
      });
    });
    const ticks = domain.ticks;
    this._scatterAxis = {
      mode: "1d",
      plotL,
      plotR,
      plotT,
      plotB,
      xMin,
      xMax,
      plotX,
      ticks,
      lanes,
      xTitle: scfg.xTitle,
      formatter: typeof scfg.xFormatter === "function" ? scfg.xFormatter : null,
      gridlines: scfg.gridlines !== false
    };
    return clusters;
  }
  /**
   * Vertical beeswarm: the transpose of _layoutScatter. The value runs UP the Y
   * axis and each category is a column (lane) across X; the swarm pack spreads
   * dots horizontally off each column's centre line. The value-axis config keys
   * (`xMin`/`xMax`/`xTitle`/`xFormatter`/`tickAmount`) still describe the value
   * axis (now Y), so flipping `orientation` keeps the same value settings.
   * @param {any} opts
   */
  _layoutScatterVertical(opts) {
    const w2 = this.w;
    const scfg = opts.scatter || {};
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const unitData = w2.seriesData.unitData || [];
    const names = w2.seriesData.seriesNames || [];
    const valueOf = (d) => this._unitValueOf(d);
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const catVals = unitData.map(
      (cat) => Array.isArray(cat) ? cat.map(valueOf) : []
    );
    const isNum = (v2) => v2 != null && isFinite(v2);
    const visible = catVals.map((_, i) => i).filter((i) => catVals[i].some(isNum));
    const Kv = Math.max(1, visible.length);
    let vmin = Infinity;
    let vmax = -Infinity;
    catVals.forEach(
      (vs) => vs.forEach((v2) => {
        if (v2 != null && isFinite(v2)) {
          if (v2 < vmin) vmin = v2;
          if (v2 > vmax) vmax = v2;
        }
      })
    );
    if (vmin === Infinity) {
      vmin = 0;
      vmax = 1;
    }
    const tickAmount = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5));
    const domain = this._scatterValueDomain(scfg, vmin, vmax, tickAmount);
    const vMin = domain.min;
    const vMax = domain.max;
    const vSpan = vMax - vMin || 1;
    const leftGutter = 46 + (scfg.xTitle ? 18 : 0);
    const bottomGutter = Kv > 1 ? 26 : 10;
    const plotL = leftGutter;
    const plotR = gw - 10;
    const plotT = 10;
    const plotB = gh - bottomGutter;
    const plotW = Math.max(4, plotR - plotL);
    const plotH = Math.max(4, plotB - plotT);
    const plotY = (v2) => plotB - (v2 - vMin) / vSpan * plotH;
    const laneW = plotW / Kv;
    const laneCx = (slot) => plotL + laneW * (slot + 0.5);
    let r = 0;
    const fixed = this._fixedRadius(opts);
    if (fixed) {
      r = fixed;
    } else {
      const maxLane = Math.max(
        1,
        ...visible.map((i) => catVals[i].filter(isNum).length)
      );
      r = Math.max(
        2,
        Math.min(6, laneW * 0.12, plotH / (2.5 * Math.sqrt(maxLane)))
      );
    }
    this._lastDotR = r;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const step = Math.max(0.5, r * spacing);
    const jitter = scfg.spread === "jitter";
    const clusters = [];
    const lanes = [];
    const maxR = sizeStats ? sizeStats.rMax : r;
    visible.forEach((ci, slot) => {
      const cx = laneCx(slot);
      lanes.push({ i: ci, cx, name: names[ci] || `series-${ci + 1}` });
      const cat = unitData[ci] || [];
      const pts = cat.map((d, j) => {
        const v2 = valueOf(d);
        const p2 = { j, py: plotY(isNum(v2) ? v2 : vMin), x: cx };
        if (sizeStats) p2.r = this._scatterRadius(d, sizeStats, r);
        return p2;
      });
      if (jitter) {
        const halfLane = Math.max(maxR, laneW / 2 - maxR);
        pts.forEach((p2, k) => {
          const t = (k * 9301 + 49297) % 233280 / 233280;
          p2.x = cx + (t * 2 - 1) * halfLane;
        });
      } else {
        this._beeswarm(pts, cx, r, step, maxR, true);
      }
      clusters.push({
        i: ci,
        cx,
        cy: (plotT + plotB) / 2,
        outerR: laneW / 2,
        dots: pts.map((p2) => ({ x: p2.x, y: p2.py, r: p2.r }))
      });
    });
    const ticks = domain.ticks;
    this._scatterAxis = {
      mode: "1d",
      orientation: "vertical",
      plotL,
      plotR,
      plotT,
      plotB,
      vMin,
      vMax,
      plotY,
      ticks,
      lanes,
      valueTitle: scfg.xTitle,
      formatter: typeof scfg.xFormatter === "function" ? scfg.xFormatter : null,
      gridlines: scfg.gridlines !== false
    };
    return clusters;
  }
  /**
   * 2D value-value scatter: each datum is a point at (`x`, `y`) on two numeric
   * axes (a scatter / bubble plot in the unit family - premium, keyed
   * transitions, per-unit colour/tooltip). Category = colour (one series group
   * per category). With `scatter.sizeRange` set, each dot is a BUBBLE scaled (by
   * area) from its `sizeField` (default 'z'). Needs the object form with numeric
   * `x` + `y`.
   * @param {any} opts
   */
  _layoutScatter2D(opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const scfg = opts.scatter || {};
    const unitData = w2.seriesData.unitData || [];
    const isNum = (v2) => typeof v2 === "number" && isFinite(v2);
    const xOf = (d) => d && typeof d === "object" ? d.x : null;
    const yOf = (d) => d && typeof d === "object" ? d.y != null ? d.y : d.value : null;
    const visible = unitData.map((_, i) => i).filter(
      (i) => (unitData[i] || []).some((d) => isNum(xOf(d)) && isNum(yOf(d)))
    );
    let xmn = Infinity;
    let xmx = -Infinity;
    let ymn = Infinity;
    let ymx = -Infinity;
    unitData.forEach(
      (cat) => (cat || []).forEach((d) => {
        const x = xOf(d);
        const y = yOf(d);
        if (isNum(x) && isNum(y)) {
          if (x < xmn) xmn = x;
          if (x > xmx) xmx = x;
          if (y < ymn) ymn = y;
          if (y > ymx) ymx = y;
        }
      })
    );
    if (xmn === Infinity) {
      xmn = 0;
      xmx = 1;
      ymn = 0;
      ymx = 1;
    }
    const xTicksN = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5));
    const yTicksN = Math.max(2, Math.round(scfg.yTickAmount > 0 ? scfg.yTickAmount : 5));
    const nx = this._niceScale(
      scfg.xMin != null ? scfg.xMin : xmn,
      scfg.xMax != null ? scfg.xMax : xmx,
      xTicksN
    );
    const ny = this._niceScale(
      scfg.yMin != null ? scfg.yMin : ymn,
      scfg.yMax != null ? scfg.yMax : ymx,
      yTicksN
    );
    const xMin = scfg.xMin != null ? scfg.xMin : nx.min;
    const xMax = scfg.xMax != null ? scfg.xMax : nx.max;
    const yMin = scfg.yMin != null ? scfg.yMin : ny.min;
    const yMax = scfg.yMax != null ? scfg.yMax : ny.max;
    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;
    const leftGutter = 46 + (scfg.yTitle ? 18 : 0);
    const bottomGutter = 30 + (scfg.xTitle ? 20 : 0);
    const plotL = leftGutter;
    const plotR = gw - 12;
    const plotT = 10;
    const plotB = gh - bottomGutter;
    const plotW = Math.max(4, plotR - plotL);
    const plotH = Math.max(4, plotB - plotT);
    const plotX = (v2) => plotL + (v2 - xMin) / xSpan * plotW;
    const plotY = (v2) => plotB - (v2 - yMin) / ySpan * plotH;
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const baseR = this._fixedRadius(opts) || 5;
    this._lastDotR = baseR;
    const clusters = [];
    visible.forEach((ci) => {
      const cat = unitData[ci] || [];
      const dots = cat.map((d) => {
        const x = xOf(d);
        const y = yOf(d);
        return {
          x: plotX(isNum(x) ? x : xMin),
          y: plotY(isNum(y) ? y : yMin),
          r: sizeStats ? this._scatterRadius(d, sizeStats, baseR) : void 0
        };
      });
      clusters.push({
        i: ci,
        cx: (plotL + plotR) / 2,
        cy: (plotT + plotB) / 2,
        outerR: plotH / 2,
        dots
      });
    });
    const mkTicks = (lo, hi, span, spacing, pinned, n) => {
      const out = [];
      if (pinned) {
        for (let k = 0; k < n; k++) out.push(lo + span * k / (n - 1));
      } else {
        const sp = spacing || span / Math.max(1, n - 1);
        for (let v2 = lo; v2 <= hi + sp * 0.5; v2 += sp) {
          out.push(Math.abs(v2) < sp * 1e-9 ? 0 : v2);
        }
      }
      return out;
    };
    this._scatterAxis = {
      mode: "2d",
      plotL,
      plotR,
      plotT,
      plotB,
      plotX,
      plotY,
      xTicks: mkTicks(
        xMin,
        xMax,
        xSpan,
        nx.spacing,
        scfg.xMin != null || scfg.xMax != null,
        xTicksN
      ),
      yTicks: mkTicks(
        yMin,
        yMax,
        ySpan,
        ny.spacing,
        scfg.yMin != null || scfg.yMax != null,
        yTicksN
      ),
      xTitle: scfg.xTitle,
      yTitle: scfg.yTitle,
      xFormatter: typeof scfg.xFormatter === "function" ? scfg.xFormatter : null,
      yFormatter: typeof scfg.yFormatter === "function" ? scfg.yFormatter : null,
      gridlines: scfg.gridlines !== false
    };
    return clusters;
  }
  /**
   * Bubble size stats for the scatter layout, or null when `scatter.sizeRange`
   * is not a `[minR, maxR]` pair. Reads the global range of each datum's
   * `sizeField` (default 'z') so a value maps to a radius (area scale) in
   * _scatterRadius.
   * @param {any} scfg @param {any[][]} unitData
   * @returns {{zmin:number,zmax:number,rMin:number,rMax:number,field:string}|null}
   */
  _scatterSizeStats(scfg, unitData) {
    const range = scfg && scfg.sizeRange;
    if (!Array.isArray(range) || range.length < 2) return null;
    const rMin = Math.max(0.5, +range[0]);
    const rMax = Math.max(rMin, +range[1]);
    const field = scfg.sizeField || "z";
    let zmin = Infinity;
    let zmax = -Infinity;
    unitData.forEach(
      (cat) => (cat || []).forEach((d) => {
        const z = d && typeof d === "object" ? d[field] : null;
        if (typeof z === "number" && isFinite(z)) {
          if (z < zmin) zmin = z;
          if (z > zmax) zmax = z;
        }
      })
    );
    if (zmin === Infinity) return null;
    return { zmin, zmax, rMin, rMax, field };
  }
  /**
   * Radius for one datum under the bubble size stats: area proportional to the
   * `sizeField` value (so radius grows with sqrt), between rMin and rMax. A
   * missing value collapses to rMin.
   * @param {any} d
   * @param {{zmin:number,zmax:number,rMin:number,rMax:number,field:string}} st
   * @param {number} fallback @returns {number}
   */
  _scatterRadius(d, st, fallback) {
    if (!st) return fallback;
    const z = d && typeof d === "object" ? d[st.field] : null;
    if (typeof z !== "number" || !isFinite(z)) return st.rMin;
    const t = st.zmax > st.zmin ? (z - st.zmin) / (st.zmax - st.zmin) : 1;
    const tc = Math.max(0, Math.min(1, t));
    const aMin = st.rMin * st.rMin;
    const aMax = st.rMax * st.rMax;
    return Math.sqrt(aMin + tc * (aMax - aMin));
  }
  /**
   * One-dimensional anti-overlap "beeswarm" pack: given points with a fixed x
   * (`px`) and a lane centre `cy`, assign each a y so no two dots overlap (centre
   * distance >= r_i + r_j). Greedy in ascending-x order, trying offsets 0, +step,
   * -step, +2step ... and taking the SMALLEST that clears every already-placed
   * neighbour still within reach in x. No-overlap always wins: a very dense lane
   * grows a taller swarm rather than stacking dots (offsets are not hard-clamped
   * to the lane). Each point may carry its own radius `r` (bubble beeswarm),
   * else `rFallback` applies; `maxR` bounds the value-window break. Deterministic
   * (no physics, no randomness).
   *
   * Orientation-agnostic: the "fixed" axis is the value axis and the "spread"
   * axis is the lane thickness. Horizontal (default): fixed = `px`, spread = `y`
   * (mutates `.y`). Vertical: fixed = `py`, spread = `x` (mutates `.x`).
   * @param {any[]} pts @param {number} center lane centre on the spread axis
   * @param {number} rFallback @param {number} step @param {number} [maxR]
   * @param {boolean} [vertical]
   */
  _beeswarm(pts, center, rFallback, step, maxR, vertical = false) {
    const fk = vertical ? "py" : "px";
    const sk = vertical ? "x" : "y";
    const order = pts.slice().sort((a, b2) => a[fk] - b2[fk]);
    const placed = [];
    const rCap = maxR != null ? maxR : rFallback;
    order.forEach((p2) => {
      const pr = p2.r != null ? p2.r : rFallback;
      let chosen = 0;
      for (let k = 0; k < 2e3; k++) {
        const off = k === 0 ? 0 : Math.ceil(k / 2) * step * (k % 2 ? 1 : -1);
        const s = center + off;
        let ok = true;
        for (let m2 = placed.length - 1; m2 >= 0; m2--) {
          const q = placed[m2];
          const df = p2[fk] - q.f;
          if (df > pr + rCap) break;
          const need = pr + q.r;
          const ds = s - q.s;
          if (df * df + ds * ds < need * need) {
            ok = false;
            break;
          }
        }
        if (ok) {
          chosen = off;
          break;
        }
      }
      p2[sk] = center + chosen;
      placed.push({ f: p2[fk], s: p2[sk], r: pr });
    });
  }
  /**
   * Value-axis domain + ticks for a 1D beeswarm. The domain ALWAYS contains
   * every datum: a swarm that clips a dot outside the plot box is a bug, so an
   * explicit `xMin`/`xMax` only FRAMES the axis and is extended by whole
   * tick-steps whenever the data would otherwise overflow. Orientation-agnostic:
   * the same value axis is X for a horizontal swarm and Y for a vertical one.
   * @param {any} scfg scatter config
   * @param {number} vmin data minimum @param {number} vmax data maximum
   * @param {number} tickAmount desired tick count
   * @returns {{ min:number, max:number, ticks:number[] }}
   */
  _scatterValueDomain(scfg, vmin, vmax, tickAmount) {
    const buildTicks = (min, max, spacing2) => {
      const ticks = [];
      for (let v2 = min; v2 <= max + spacing2 * 0.5; v2 += spacing2) {
        ticks.push(Math.abs(v2) < spacing2 * 1e-9 ? 0 : v2);
      }
      return ticks;
    };
    if (scfg.xMin != null || scfg.xMax != null) {
      let min = scfg.xMin != null ? scfg.xMin : vmin;
      let max = scfg.xMax != null ? scfg.xMax : vmax;
      if (!(max > min)) max = min + 1;
      const spacing2 = (max - min) / Math.max(1, tickAmount - 1);
      if (vmin < min) min -= Math.ceil((min - vmin) / spacing2) * spacing2;
      if (vmax > max) max += Math.ceil((vmax - max) / spacing2) * spacing2;
      return { min, max, ticks: buildTicks(min, max, spacing2) };
    }
    const nice = this._niceScale(vmin, vmax, tickAmount);
    const spacing = nice.spacing || (nice.max - nice.min) / Math.max(1, tickAmount - 1);
    return { min: nice.min, max: nice.max, ticks: buildTicks(nice.min, nice.max, spacing) };
  }
  /**
   * A "nice" numeric scale [min, max] + tick spacing covering [dataMin, dataMax]
   * with about `ticks` ticks, using rounded 1/2/5 x 10^n steps. Homegrown (no
   * dependency) - lean-core.
   * @param {number} dataMin @param {number} dataMax @param {number} ticks
   * @returns {{min:number,max:number,spacing:number}}
   */
  _niceScale(dataMin, dataMax, ticks) {
    const lo = dataMin;
    let hi = dataMax;
    if (!(hi > lo)) hi = lo + 1;
    const range = this._niceNum(hi - lo, false);
    const spacing = this._niceNum(range / Math.max(1, ticks - 1), true);
    return {
      min: Math.floor(lo / spacing) * spacing,
      max: Math.ceil(hi / spacing) * spacing,
      spacing
    };
  }
  /**
   * Round a range to a "nice" 1/2/5 x 10^n number (Heckbert's loose/round label
   * algorithm).
   * @param {number} range @param {boolean} round @returns {number}
   */
  _niceNum(range, round) {
    const rng = range > 0 ? range : 1;
    const exp = Math.floor(Math.log(rng) / Math.LN10);
    const frac = rng / Math.pow(10, exp);
    let nf;
    if (round) {
      nf = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
    } else {
      nf = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
    }
    return nf * Math.pow(10, exp);
  }
  /**
   * Draw the scatter chrome behind the dots, from the geometry the layout
   * stashed on `this._scatterAxis`. 1D (beeswarm): vertical X gridlines +
   * baseline + tick labels (+ x title) + a per-lane category label in the
   * category colour. 2D: both X + Y gridlines, both axes' tick labels, and
   * rotated/placed axis titles (no lane labels - category is colour). Browser-
   * only (SSR renders the dots without the chrome, as with cluster labels).
   * @param {any} ret @param {Graphics} graphics
   */
  _drawScatterAxes(ret, graphics) {
    const w2 = this.w;
    if (!Environment.isBrowser()) return;
    const ax = this._scatterAxis;
    if (!ax) return;
    const NS = "http://www.w3.org/2000/svg";
    const g2 = graphics.group({ class: "apexcharts-unit-axis" });
    const gridColor = w2.config.grid && w2.config.grid.borderColor || "rgba(128,128,128,0.18)";
    const axisColor = "rgba(128,128,128,0.5)";
    const cfgColors = w2.config.xaxis && w2.config.xaxis.labels && w2.config.xaxis.labels.style && w2.config.xaxis.labels.style.colors;
    const configuredLabelColor = Array.isArray(cfgColors) ? cfgColors[0] : cfgColors;
    const labelColor = configuredLabelColor || "rgba(120,130,140,0.9)";
    const line = (x1, y1, x2, y2, stroke) => {
      const l = BrowserAPIs.createElementNS(NS, "line");
      l.setAttribute("x1", String(x1));
      l.setAttribute("y1", String(y1));
      l.setAttribute("x2", String(x2));
      l.setAttribute("y2", String(y2));
      l.setAttribute("stroke", stroke);
      l.setAttribute("shape-rendering", "crispEdges");
      g2.node.appendChild(l);
    };
    const text = (str, x, y, anchor, fill, size, weight, cls) => {
      const t = BrowserAPIs.createElementNS(NS, "text");
      t.setAttribute("class", cls);
      t.setAttribute("x", String(x));
      t.setAttribute("y", String(y));
      t.setAttribute("text-anchor", anchor);
      t.setAttribute("dominant-baseline", "middle");
      t.setAttribute("font-size", `${size}px`);
      t.setAttribute("font-family", w2.config.chart.fontFamily || "inherit");
      t.setAttribute("font-weight", String(weight));
      t.setAttribute("fill", fill);
      t.textContent = str;
      g2.node.appendChild(t);
    };
    if (ax.mode === "2d") {
      ax.yTicks.forEach((v2) => {
        const y = ax.plotY(v2);
        if (ax.gridlines) line(ax.plotL, y, ax.plotR, y, gridColor);
        const label = ax.yFormatter ? String(ax.yFormatter(v2)) : this._formatTick(v2);
        text(label, ax.plotL - 8, y, "end", labelColor, 11, 400, "apexcharts-unit-tick");
      });
      ax.xTicks.forEach((v2) => {
        const x = ax.plotX(v2);
        if (ax.gridlines) line(x, ax.plotT, x, ax.plotB, gridColor);
        const label = ax.xFormatter ? String(ax.xFormatter(v2)) : this._formatTick(v2);
        text(label, x, ax.plotB + 14, "middle", labelColor, 11, 400, "apexcharts-unit-tick");
      });
      line(ax.plotL, ax.plotB, ax.plotR, ax.plotB, axisColor);
      line(ax.plotL, ax.plotT, ax.plotL, ax.plotB, axisColor);
      if (ax.xTitle) {
        text(
          String(ax.xTitle),
          (ax.plotL + ax.plotR) / 2,
          ax.plotB + 32,
          "middle",
          labelColor,
          12,
          600,
          "apexcharts-unit-axis-title"
        );
      }
      if (ax.yTitle) {
        const yt = BrowserAPIs.createElementNS(NS, "text");
        yt.setAttribute("class", "apexcharts-unit-axis-title");
        const tx = 14;
        const ty = (ax.plotT + ax.plotB) / 2;
        yt.setAttribute("x", String(tx));
        yt.setAttribute("y", String(ty));
        yt.setAttribute("text-anchor", "middle");
        yt.setAttribute("font-size", "12px");
        yt.setAttribute("font-family", w2.config.chart.fontFamily || "inherit");
        yt.setAttribute("font-weight", "600");
        yt.setAttribute("fill", labelColor);
        yt.setAttribute("transform", `rotate(-90 ${tx} ${ty})`);
        yt.textContent = String(ax.yTitle);
        g2.node.appendChild(yt);
      }
      ret.add(g2);
      return;
    }
    if (ax.orientation === "vertical") {
      ax.ticks.forEach((v2) => {
        const y = ax.plotY(v2);
        if (ax.gridlines) line(ax.plotL, y, ax.plotR, y, gridColor);
        const label = ax.formatter ? String(ax.formatter(v2)) : this._formatTick(v2);
        text(label, ax.plotL - 8, y, "end", labelColor, 11, 400, "apexcharts-unit-tick");
      });
      line(ax.plotL, ax.plotT, ax.plotL, ax.plotB, axisColor);
      if (ax.valueTitle) {
        const yt = BrowserAPIs.createElementNS(NS, "text");
        yt.setAttribute("class", "apexcharts-unit-axis-title");
        const tx = 14;
        const ty = (ax.plotT + ax.plotB) / 2;
        yt.setAttribute("x", String(tx));
        yt.setAttribute("y", String(ty));
        yt.setAttribute("text-anchor", "middle");
        yt.setAttribute("font-size", "12px");
        yt.setAttribute("font-family", w2.config.chart.fontFamily || "inherit");
        yt.setAttribute("font-weight", "600");
        yt.setAttribute("fill", labelColor);
        yt.setAttribute("transform", `rotate(-90 ${tx} ${ty})`);
        yt.textContent = String(ax.valueTitle);
        g2.node.appendChild(yt);
      }
      ax.lanes.forEach((lane) => {
        const color = configuredLabelColor || w2.globals.colors[lane.i] || w2.globals.colors[0] || "#008FFB";
        text(lane.name, lane.cx, ax.plotB + 16, "middle", color, 12, 600, "apexcharts-unit-lane-label");
      });
      ret.add(g2);
      return;
    }
    ax.ticks.forEach((v2, idx) => {
      const x = ax.plotX(v2);
      if (ax.gridlines) line(x, ax.plotT, x, ax.plotB, gridColor);
      const label = ax.formatter ? String(ax.formatter(v2)) : this._formatTick(v2);
      const anchor = idx === 0 ? "start" : idx === ax.ticks.length - 1 ? "end" : "middle";
      text(label, x, ax.plotB + 14, anchor, labelColor, 11, 400, "apexcharts-unit-tick");
    });
    line(ax.plotL, ax.plotB, ax.plotR, ax.plotB, axisColor);
    if (ax.xTitle) {
      text(
        String(ax.xTitle),
        (ax.plotL + ax.plotR) / 2,
        ax.plotB + 32,
        "middle",
        labelColor,
        12,
        600,
        "apexcharts-unit-axis-title"
      );
    }
    if (ax.plotL > 12) {
      ax.lanes.forEach((lane) => {
        const color = configuredLabelColor || w2.globals.colors[lane.i] || w2.globals.colors[0] || "#008FFB";
        text(lane.name, ax.plotL - 8, lane.cy, "end", color, 12, 600, "apexcharts-unit-lane-label");
      });
    }
    ret.add(g2);
  }
  /**
   * Compact tick-value formatting: integers as-is, otherwise trimmed to a short
   * decimal; large magnitudes get a k/M suffix.
   * @param {number} v @returns {string}
   */
  _formatTick(v2) {
    if (!isFinite(v2)) return "";
    const a = Math.abs(v2);
    if (a >= 1e6) return `${+(v2 / 1e6).toFixed(1)}M`;
    if (a >= 1e4) return `${+(v2 / 1e3).toFixed(1)}k`;
    if (Number.isInteger(v2)) return String(v2);
    return String(+v2.toFixed(2));
  }
  /**
   * Distribute `total` whole cells across `counts` in proportion to each value,
   * using the largest-remainder method so the parts sum to exactly `total`
   * (used by the grid/waffle percentage mode).
   * @param {number[]} counts @param {number} total @returns {number[]}
   */
  _largestRemainder(counts, total) {
    const sum = counts.reduce((a, b2) => a + b2, 0);
    if (sum <= 0 || total <= 0) return counts.map(() => 0);
    const exact = counts.map((c) => c / sum * total);
    const floors = exact.map((v2) => Math.floor(v2));
    const used = floors.reduce((a, b2) => a + b2, 0);
    const remaining = Math.max(0, total - used);
    const byFrac = exact.map((v2, i) => ({ i, frac: v2 - Math.floor(v2) })).sort((a, b2) => b2.frac - a.frac);
    const out = floors.slice();
    for (let n = 0; n < remaining && n < byFrac.length; n++) {
      out[byFrac[n].i]++;
    }
    return out;
  }
  /**
   * Phyllotaxis (sunflower) placement for `n` points around (cx, cy).
   * @param {number} cx @param {number} cy @param {number} n
   * @param {number} step @param {number} startIndex
   * @returns {{x:number,y:number}[]}
   */
  _spiral(cx, cy, n, step, startIndex) {
    const pts = [];
    for (let k = 0; k < n; k++) {
      const idx = startIndex + k;
      const r = step * Math.sqrt(idx + 0.5);
      const theta = idx * GOLDEN_ANGLE;
      pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
    }
    return pts;
  }
  /**
   * A fixed dot radius, if the shape/size implies one: an explicit numeric
   * `size`, or an `image` shape (sized by its own width/height). Returns null
   * when dots should auto-size to fit the plot.
   * @param {any} opts @returns {number | null}
   */
  _fixedRadius(opts) {
    if (opts.shape === "image" && opts.image) {
      return Math.max(opts.image.width || 20, opts.image.height || 20) / 2;
    }
    if (this._bubbleActive(opts) && typeof opts.sizeByValue.maxRadius === "number") {
      return opts.sizeByValue.maxRadius > 0 ? opts.sizeByValue.maxRadius : null;
    }
    if (typeof opts.size === "number" && opts.size > 0) return opts.size;
    return null;
  }
  /**
   * Whether opt-in bubble sizing applies: enabled, and the shape sizes per
   * mark. Squares and images keep a uniform size; a pictogram does not, because
   * its scale is derived per mark from the same radius a circle would use.
   * @param {any} opts @returns {boolean}
   */
  _bubbleActive(opts) {
    const sbv = opts.sizeByValue;
    return !!(sbv && sbv.enabled && opts.shape !== "image" && opts.shape !== "square");
  }
  /**
   * This datum's numeric value for sizing / tooltip: the number itself, or an
   * object's `value` / `y`. Null when there is no usable number.
   * @param {any} d @returns {number | null}
   */
  _unitValueOf(d) {
    if (typeof d === "number") return d;
    if (d && typeof d === "object") {
      const v2 = d.value != null ? d.value : d.y;
      return typeof v2 === "number" ? v2 : null;
    }
    return null;
  }
  /**
   * Radius for one bubble given the value stats. Default 'area' scaling makes
   * a bubble's AREA proportional to its value (radius grows with sqrt); 'linear'
   * scales the radius directly. Missing values collapse to the min radius.
   * @param {number|null} v
   * @param {{min:number,max:number,minR:number,maxR:number,scale:string}} stats
   * @returns {number}
   */
  _radiusForValue(v2, stats) {
    if (v2 == null || !isFinite(v2)) return stats.minR;
    const t = stats.max > stats.min ? (v2 - stats.min) / (stats.max - stats.min) : 1;
    const tc = Math.max(0, Math.min(1, t));
    if (stats.scale === "linear") {
      return stats.minR + tc * (stats.maxR - stats.minR);
    }
    const aMin = stats.minR * stats.minR;
    const aMax = stats.maxR * stats.maxR;
    return Math.sqrt(aMin + tc * (aMax - aMin));
  }
  /**
   * Value stats + radius bounds for bubble sizing, or null when it does not
   * apply (disabled, non-circle shape, or no per-unit values). `maxR` is the
   * reference radius the layout already spaced the lattice for; `minR` defaults
   * to ~35% of it.
   * @param {any[][]} unitData @param {any} opts @param {number} refR
   * @returns {{min:number,max:number,minR:number,maxR:number,scale:string}|null}
   */
  _bubbleStats(unitData, opts, refR) {
    if (!this._bubbleActive(opts)) return null;
    let vmin = Infinity;
    let vmax = -Infinity;
    unitData.forEach((cat) => {
      if (!cat) return;
      cat.forEach((d) => {
        const v2 = this._unitValueOf(d);
        if (v2 != null && isFinite(v2)) {
          if (v2 < vmin) vmin = v2;
          if (v2 > vmax) vmax = v2;
        }
      });
    });
    if (vmin === Infinity || vmax < vmin) return null;
    const sbv = opts.sizeByValue;
    const maxR = refR;
    const minR = Math.max(
      1,
      Math.min(
        maxR,
        typeof sbv.minRadius === "number" ? sbv.minRadius : maxR * 0.35
      )
    );
    return {
      min: vmin,
      max: vmax,
      minR,
      maxR,
      scale: sbv.scale === "linear" ? "linear" : "area"
    };
  }
  /**
   * Radial step between successive spiral shells. A fixed radius derives the
   * step directly; 'auto' derives it so a cluster of `count` dots fits `availR`.
   * @param {any} opts @param {number} availR @param {number} count
   * @returns {number}
   */
  _resolveStep(opts, availR, count) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const fixed = this._fixedRadius(opts);
    if (fixed) return 2 * fixed * spacing;
    return availR / (Math.sqrt(Math.max(1, count)) + 0.5);
  }
  /**
   * @param {number} step @param {any} opts
   * @returns {number}
   */
  _dotRadiusFromStep(step, opts) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const fixed = this._fixedRadius(opts);
    if (fixed) return fixed;
    return Math.max(1, step / (2 * spacing));
  }
  /**
   * Corner-anchored shapes (square, image) position by their top-left x/y;
   * circles position by their centre cx/cy.
   * @param {any} opts @returns {boolean}
   */
  _isCorner(opts) {
    return opts.shape === "square" || opts.shape === "image";
  }
  /**
   * Half-width/height used to convert a centre point to a corner shape's x/y.
   * @param {any} opts @param {number} [r] this mark's own radius; defaults to
   *   the chart-wide one (an image is sized by its own width/height either way)
   * @returns {{hx:number, hy:number}}
   */
  _halfExtent(opts, r) {
    if (opts.shape === "image" && opts.image) {
      return { hx: (opts.image.width || 20) / 2, hy: (opts.image.height || 20) / 2 };
    }
    const rr = r != null ? r : this._lastDotR;
    return { hx: rr, hy: rr };
  }
  /**
   * The draw + placement rule for ONE mark.
   *
   * Positioning used to be a chart-GLOBAL decision - `_isCorner(opts)` and a
   * single `_halfExtent(opts)`, hoisted out of the gather loop - which held only
   * while every mark in a render was the same element. Two things broke that:
   * a pictogram render where dot 3 is a <circle> and dot 4 a <path>, and the
   * plainer bug that a `square` sized from a per-position radius (`_drawDot`
   * uses the dot's own `rj`) was still being CENTRED with the chart-wide
   * `_lastDotR`, so a layout returning per-mark radii drew every square off its
   * own slot by `_lastDotR - r`.
   *
   * So the rule travels with the mark. A spec is one frozen object per distinct
   * (kind, size) - shared by every dot that uses it, resolved once per render -
   * carrying an int the frame loop switches on. `_place` is the only writer.
   *
   * @typedef {object} UnitMarkSpec
   * @property {number} pk PK_CIRCLE | PK_CORNER | PK_GLYPH
   * @property {number} [hx] corner: half-width
   * @property {number} [hy] corner: half-height
   * @property {any} [mark] glyph: the resolved mark definition
   * @property {string} [d] glyph: path data, in the mark's own viewBox units
   * @property {string} [fillRule] glyph: 'evenodd' when the mark declares it
   * @property {number} [s] glyph: uniform scale from viewBox units to px
   * @property {number} [ox] glyph: pre-scaled x of the viewBox centre
   * @property {number} [oy] glyph: pre-scaled y of the viewBox centre
   * @property {string} [tail] glyph: the pre-built `) scale(s)` transform tail
   * @property {number} [r] the radius this spec was fitted to
   */
  /**
   * Position one mark at (x, y), whatever element it is.
   *
   * Circles and corner shapes write byte-identically to what they wrote before
   * this seam existed, so the morph capture and every existing test read the
   * same DOM. A glyph writes ONE attribute where they write two.
   *
   * @param {SVGElement} node @param {UnitMarkSpec} spec
   * @param {number} x @param {number} y
   */
  _place(node, spec, x, y) {
    const s = (
      /** @type {any} */
      spec
    );
    if (s.pk === PK_GLYPH) {
      node.setAttribute(
        "transform",
        "translate(" + (x - s.ox) + "," + (y - s.oy) + s.tail
      );
    } else if (s.pk === PK_CORNER) {
      node.setAttribute("x", String(x - s.hx));
      node.setAttribute("y", String(y - s.hy));
    } else {
      node.setAttribute("cx", String(x));
      node.setAttribute("cy", String(y));
    }
  }
  /**
   * The spec for the chart-wide shape (no pictogram, no per-mark radius).
   * @param {any} opts @param {number} [r]
   * @returns {UnitMarkSpec}
   */
  _baseSpec(opts, r) {
    const rr = r != null ? r : this._lastDotR;
    if (!this._isCorner(opts)) return { pk: PK_CIRCLE, r: rr };
    const { hx, hy } = this._halfExtent(opts, rr);
    return { pk: PK_CORNER, hx, hy, r: rr };
  }
  /**
   * Resolve whatever `pictogram.mark` / `datum.mark` held into a mark
   * definition, or null. A name goes through the registry; an object or a bare
   * path string is taken as-is.
   *
   * An unresolvable mark warns ONCE per name and falls back rather than
   * dropping the unit: a typo should cost you the glyph, not the data point.
   *
   * @param {any} ref @returns {any|null}
   */
  _resolveMark(ref) {
    if (ref == null) return null;
    if (typeof ref === "object") return normalizeUnitMark(ref);
    if (typeof ref !== "string" || !ref) return null;
    const s = ref.trim();
    if (s[0] === "M" || s[0] === "m") return normalizeUnitMark(s);
    const found = getUnitMark(s);
    if (found) return found;
    if (!this._markWarned) this._markWarned = /* @__PURE__ */ new Set();
    if (!this._markWarned.has(s)) {
      this._markWarned.add(s);
      console.warn(
        `[ApexCharts] unit chart: no mark named "${s}" is registered. Register one with ApexCharts.registerUnitMark("${s}", pathData), or import a catalog from 'apexcharts/pictograms'.`
      );
    }
    return null;
  }
  /**
   * The draw spec for one glyph at the current lattice pitch, cached per
   * (mark, radius) for the render so thousands of units of one glyph resolve
   * once and then share both the spec and the `d` STRING.
   *
   * The scale lives in the transform rather than being baked into `d`, for two
   * reasons: baking needs a full path parser at runtime (the unit-shapes one
   * lives in a separate optional module, and arcs cannot be scaled by naive
   * number substitution), and a constant `scale(s)` costs the same single
   * attribute write per frame that a bare translate would.
   *
   * Sizing is derived from `dotR` - the radius the LAYOUT chose - so a glyph
   * occupies the box the dot itself would have. Swapping `circle` for a
   * pictogram therefore never re-flows the chart: same pitch, same slots.
   *
   * @param {any} mark @param {number} dotR @param {any} pcfg
   * @returns {UnitMarkSpec}
   */
  _glyphSpec(mark, dotR, pcfg) {
    const qr = Math.round(dotR * 10) / 10;
    const key = mark.name + "|" + mark.path.length + "|" + qr;
    const hit = this._specCache.get(key);
    if (hit) return hit;
    const vb = mark.viewBox || [0, 0, 100, 100];
    const pad = Math.max(0, Math.min(0.9, pcfg.padding || 0));
    const grow = typeof pcfg.scale === "number" && pcfg.scale > 0 ? pcfg.scale : 1;
    const box = 2 * qr * (1 - pad) * grow;
    const s = pcfg.fit === "width" ? box / vb[2] : pcfg.fit === "height" ? box / vb[3] : box / Math.max(vb[2], vb[3]);
    const spec = Object.freeze({
      pk: PK_GLYPH,
      mark,
      d: mark.path,
      fillRule: mark.fillRule,
      s,
      ox: (vb[0] + vb[2] / 2) * s,
      oy: (vb[1] + vb[3] / 2) * s,
      tail: ") scale(" + s + ")",
      r: qr
    });
    this._specCache.set(key, spec);
    return spec;
  }
  /**
   * Which mark THIS unit draws.
   *
   * Precedence mirrors how `datum.fillColor` already overrides the category
   * colour: the datum's own `mark` first (a per-unit override, so one crowd can
   * mix glyphs), then the per-series entry of a `mark` array, then the one
   * chart-wide mark.
   *
   * @param {any} opts @param {any} datum @param {number} i @param {number} r
   * @returns {UnitMarkSpec}
   */
  _markSpecFor(opts, datum, i, r) {
    if (opts.shape !== "pictogram") return this._baseSpec(opts, r);
    const pcfg = opts.pictogram || {};
    const own = datum && typeof datum === "object" ? datum.mark : void 0;
    const cfg = Array.isArray(pcfg.mark) ? pcfg.mark[i % pcfg.mark.length] : pcfg.mark;
    const mark = this._resolveMark(own != null ? own : cfg);
    if (mark) return this._glyphSpec(mark, r, pcfg);
    return this._baseSpec(
      __spreadProps(__spreadValues({}, opts), { shape: pcfg.fallback === "square" ? "square" : "circle" }),
      r
    );
  }
  /**
   * Draw one dot (circle, square, or image icon) with the category fill +
   * stroke, tagged so the shared non-axis tooltip and hover reuse work.
   * @param {Graphics} graphics @param {any} opts @param {number} dotR
   * @param {string} color @param {number} i @param {number} j
   * @param {UnitMarkSpec} [spec] this mark's resolved spec; defaults to the
   *   chart-wide shape
   * @returns {any}
   */
  _drawDot(graphics, opts, dotR, color, i, j, spec) {
    const w2 = this.w;
    const strokeW = w2.config.stroke.show ? w2.config.stroke.width : 0;
    const strokeColor = Array.isArray(w2.globals.stroke.colors) ? w2.globals.stroke.colors[i] || "none" : "none";
    const fillOpacity = typeof w2.config.fill.opacity === "number" ? w2.config.fill.opacity : 1;
    let el;
    if (spec && spec.pk === PK_GLYPH) {
      el = w2.dom.Paper.path(spec.d);
      el.node.setAttribute("fill", color);
      if (spec.fillRule === "evenodd") {
        el.node.setAttribute("fill-rule", "evenodd");
      }
      if (fillOpacity < 1) el.node.setAttribute("fill-opacity", String(fillOpacity));
      el.node.setAttribute("data:r", String(spec.r));
    } else if (opts.shape === "image" && opts.image && opts.image.src) {
      const iw = opts.image.width || 20;
      const ih = opts.image.height || 20;
      el = w2.dom.Paper.image(opts.image.src);
      el.node.setAttribute("width", String(iw));
      el.node.setAttribute("height", String(ih));
      el.node.setAttribute("preserveAspectRatio", "xMidYMid meet");
      if (opts.image.tint) {
        el.node.setAttribute("filter", `url(#${this._tintFilter(color)})`);
      }
    } else if (opts.shape === "square") {
      const side = dotR * 2;
      el = graphics.drawRect(0, 0, side, side, opts.borderRadius || 0, color, 1, strokeW, strokeColor);
      el.node.setAttribute("fill", color);
      if (fillOpacity < 1) el.node.setAttribute("fill-opacity", String(fillOpacity));
    } else {
      el = graphics.drawCircle(dotR, {
        fill: color,
        "stroke-width": strokeW,
        stroke: strokeColor
      });
      el.node.setAttribute("fill", color);
      if (fillOpacity < 1) el.node.setAttribute("fill-opacity", String(fillOpacity));
    }
    el.node.classList.add("apexcharts-unit-area");
    el.node.setAttribute("i", String(i));
    el.node.setAttribute("j", String(j));
    return el;
  }
  /**
   * Ensure (once per colour) an SVG recolour filter exists in the chart's defs
   * and return its id. The filter floods `color` and clips it to the source
   * graphic's alpha (feComposite operator="in"), so an `<image>` referencing a
   * monochrome icon is repainted in `color` while keeping its silhouette. Reused
   * across every dot of the same colour.
   * @param {string} color @returns {string}
   */
  _tintFilter(color) {
    const w2 = this.w;
    const NS = "http://www.w3.org/2000/svg";
    const safe = String(color).replace(/[^a-zA-Z0-9]/g, "");
    const id = `apexcharts-unit-tint-${w2.globals.chartID}-${safe}`;
    const svg = w2.dom.Paper.node;
    if (svg.querySelector(`#${id}`)) return id;
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = BrowserAPIs.createElementNS(NS, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    const filter = BrowserAPIs.createElementNS(NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("x", "0%");
    filter.setAttribute("y", "0%");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");
    const flood = BrowserAPIs.createElementNS(NS, "feFlood");
    flood.setAttribute("flood-color", color);
    flood.setAttribute("result", "flood");
    const comp = BrowserAPIs.createElementNS(NS, "feComposite");
    comp.setAttribute("in", "flood");
    comp.setAttribute("in2", "SourceAlpha");
    comp.setAttribute("operator", "in");
    filter.appendChild(flood);
    filter.appendChild(comp);
    defs.appendChild(filter);
    return id;
  }
  /**
   * Position a non-animated dot at (x, y). Circles use cx/cy at the centre;
   * corner shapes (square, image) use x/y at the top-left; a pictogram rides a
   * transform. Callers that already hold the mark's spec pass it; the rest get
   * the chart-wide one.
   * @param {SVGElement} node @param {any} opts @param {number} x @param {number} y
   * @param {UnitMarkSpec} [spec]
   */
  _placeDot(node, opts, x, y, spec) {
    this._place(node, spec || this._baseSpec(opts), x, y);
  }
  /**
   * Parse a `#rgb` / `#rrggbb` / `rgb()` / `rgba()` colour to `[r, g, b]`, or
   * null if it cannot be parsed (the colour tween is then skipped).
   * @param {string} str @returns {number[] | null}
   */
  _rgb(str) {
    if (typeof str !== "string") return null;
    let s = str.trim();
    if (s[0] === "#") {
      if (s.length === 4) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
      const n = parseInt(s.slice(1, 7), 16);
      if (isNaN(n)) return null;
      return [n >> 16 & 255, n >> 8 & 255, n & 255];
    }
    const m2 = s.match(/rgba?\(([^)]+)\)/);
    if (m2) {
      const p2 = m2[1].split(",").map((x) => parseFloat(x));
      if (p2.length >= 3 && p2.every((v2) => !isNaN(v2))) return [p2[0], p2[1], p2[2]];
    }
    return null;
  }
  /**
   * Whether to run the gather / transition animation. Runs on the initial mount
   * and on data-driven updates (keyed old->new tween or cross-type burst).
   * Skipped: in SSR, when animations are off, when the caller passed
   * `animate:false` (shouldAnimate === false), on a PURE window resize (resized
   * with no data change - re-gathering on every resize would be jarring), and
   * when the user prefers reduced motion.
   *
   * Note: `w.globals.resized` is set true on every update (not just window
   * resize), so it must be paired with `!dataChanged` to isolate a real resize.
   * @returns {boolean}
   */
  _shouldAnimate() {
    const w2 = this.w;
    const anim = w2.config.chart.animations;
    if (!Environment.isBrowser()) return false;
    if (!anim || anim.enabled === false) return false;
    if (w2.globals.shouldAnimate === false) return false;
    if (w2.globals.resized && !w2.globals.dataChanged) return false;
    if (anim.respectReducedMotion && prefersReducedMotion()) return false;
    return true;
  }
  /**
   * Give every dot an x/y spring, reusing the live springs of a gather this
   * render just cancelled.
   *
   * The reuse is the whole point of the spring path. A carried spring holds a
   * dot's real on-screen position AND its velocity, so an interrupted gather
   * resumes from there. Without it the dot restarts from `cx0`, which on an
   * update is the slot it was still travelling towards - so every interruption
   * teleports it forward and then re-animates from a standstill. A dragged
   * slider or a scrubbed storyboard interrupts on almost every frame, which is
   * where that reads worst.
   *
   * Springs left over from a completed gather are at rest on their targets, so
   * carrying them is identical to making fresh ones. Only an interrupted flight
   * carries anything.
   *
   * @param {UnitAnimDot[]} dots
   * @param {any} gcfg plotOptions.unit.gather
   * @param {number} speed chart.animations.speed, in ms
   */
  _seedSprings(dots, gcfg, speed) {
    const [stiffness, damping] = springParams(gcfg.spring, speed);
    const live = this.ctx ? this.ctx._unitSprings : null;
    const springs = /* @__PURE__ */ new Map();
    for (let k = 0; k < dots.length; k++) {
      const d = dots[k];
      const carried = live && !d.isEnter && d.key != null ? live.get(d.key) : null;
      const sx = carried ? carried.x : v(d.cx0, stiffness, damping);
      const sy = carried ? carried.y : v(d.cy0, stiffness, damping);
      if (carried) {
        sx.stiffness = stiffness;
        sy.stiffness = stiffness;
        sx.damping = damping;
        sy.damping = damping;
        d.cx0 = sx.value;
        d.cy0 = sy.value;
        this._place(d.node, d.spec, d.cx0, d.cy0);
        if (sx.velocity !== 0 || sy.velocity !== 0) d.delay = 0;
      }
      d.sx = sx;
      d.sy = sy;
      if (d.key != null) springs.set(d.key, { x: sx, y: sy });
    }
    if (this.ctx) this.ctx._unitSprings = springs;
  }
  /**
   * One rAF loop that tweens every dot from its start (cx0/cy0 - either the
   * cluster centre on first mount / for entering dots, or its previous slot on
   * an update) to its target slot, staggered by index. Entering dots fade in;
   * moving dots stay opaque. Dots whose group colour changed (a 'flow' regroup)
   * cross-fade their fill from the old colour to the new one over the same ease;
   * dots whose radius changed (bubble sizing) grow/shrink over it too (circles).
   *
   * Position travels on a spring by default (`gather.motion`), so a gather
   * interrupted by the next render resumes from where the dots actually are,
   * carrying their velocity, rather than restarting from a standstill. Colour,
   * radius and opacity stay on a fixed-duration ease either way: those are 0..1
   * quantities, and the shared solver's rest thresholds are absolute (0.05 in
   * caller units), which is negligible for pixels but 5% of a unit interval.
   * @param {UnitAnimDot[]} dots
   */
  _runGather(dots) {
    const w$1 = this.w;
    const opts = w$1.config.plotOptions.unit;
    const speed = Math.max(1, w$1.config.chart.animations.speed || 800);
    const maxDelay = Math.min(speed * 0.6, 450);
    const n = dots.length;
    for (let k = 0; k < n; k++) {
      dots[k].delay = n > 1 ? k / (n - 1) * maxDelay : 0;
    }
    const gcfg = opts.gather || {};
    const motion = gcfg.motion || "auto";
    const useSpring = motion === "spring" || motion === "auto" && (!gcfg.easing || gcfg.easing === "outCubic");
    if (useSpring) this._seedSprings(dots, gcfg, speed);
    else if (this.ctx) this.ctx._unitSprings = null;
    for (let k = 0; k < n; k++) {
      const d = dots[k];
      if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
        d.node.setAttribute("r", String(d.r0));
      }
    }
    for (let k = 0; k < n; k++) {
      const d = dots[k];
      if (d.fill0 && d.fill1 && d.fill0 !== d.fill1) {
        d._c0 = this._rgb(d.fill0);
        d._c1 = this._rgb(d.fill1);
      }
    }
    const easePos = gcfg.easing === "outBack" ? easeOutBack(typeof gcfg.overshoot === "number" ? gcfg.overshoot : 1.70158) : gcfg.easing === "inOutCubic" ? easeInOutCubic : easeOutCubic;
    if (this.w.globals.unitGatherRAF != null) {
      BrowserAPIs.cancelAnimationFrame(this.w.globals.unitGatherRAF);
      this.w.globals.unitGatherRAF = null;
    }
    const start = performance.now();
    let last = start;
    const stepFn = (now) => {
      if (this.w.globals.isDestroyed) {
        this.w.globals.unitGatherRAF = null;
        this.w.globals.animationEnded = true;
        return;
      }
      const dt = Math.min(MAX_FRAME_STEP, Math.max(0, (now - last) / 1e3));
      last = now;
      let done = true;
      for (let k = 0; k < n; k++) {
        const d = dots[k];
        const elapsed = now - start - d.delay;
        const t = Math.max(0, Math.min(1, elapsed / speed));
        const ec = easeOutCubic(t);
        let cx, cy;
        if (d.sx && d.sy) {
          if (elapsed >= 0 && !d.released) {
            w(d.sx, d.x);
            w(d.sy, d.y);
            d.released = true;
          }
          const restX = b(d.sx, dt);
          const restY = b(d.sy, dt);
          if (!d.released || !restX || !restY) done = false;
          cx = d.sx.value;
          cy = d.sy.value;
        } else {
          const e = easePos(t);
          cx = d.cx0 + (d.x - d.cx0) * e;
          cy = d.cy0 + (d.y - d.cy0) * e;
        }
        this._place(d.node, d.spec, cx, cy);
        if (d.isEnter) d.node.style.opacity = String(Math.min(1, t * 2.5));
        if (d._c0 && d._c1) {
          const cr = Math.round(d._c0[0] + (d._c1[0] - d._c0[0]) * ec);
          const cg = Math.round(d._c0[1] + (d._c1[1] - d._c0[1]) * ec);
          const cb = Math.round(d._c0[2] + (d._c1[2] - d._c0[2]) * ec);
          d.node.setAttribute("fill", `rgb(${cr},${cg},${cb})`);
        }
        if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
          d.node.setAttribute("r", String(d.r0 + (d.r1 - d.r0) * ec));
        }
        if (t < 1) done = false;
      }
      if (done) {
        for (let k = 0; k < n; k++) {
          const d = dots[k];
          d.node.style.opacity = "";
          if (d._c1 && d.fill1) d.node.setAttribute("fill", d.fill1);
          if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
            d.node.setAttribute("r", String(d.r1));
          }
        }
        this.w.globals.unitGatherRAF = null;
        this.w.globals.animationEnded = true;
      } else {
        this.w.globals.unitGatherRAF = BrowserAPIs.requestAnimationFrame(stepFn);
      }
    };
    this.w.globals.unitGatherRAF = BrowserAPIs.requestAnimationFrame(stepFn);
  }
  /**
   * Keys present in the previous render but not the current one, resolved back
   * to their old slot {x, y, fill}. These are the dots that must animate out.
   * @param {Map<string, {x:number,y:number,fill:string,r?:number,spec?:any}>} prev
   * @param {Map<string, {x:number,y:number,fill:string,r?:number,spec?:any}>} nextPrev
   * @param {any} opts
   * @returns {{x:number,y:number,fill:string,r?:number,spec?:any}[]}
   */
  _collectExits(prev, nextPrev, opts) {
    const cap = Math.max(0, opts.maxUnits || 5e3);
    const exits = [];
    for (const [key, slot] of prev) {
      if (!nextPrev.has(key)) {
        exits.push(slot);
        if (exits.length >= cap) break;
      }
    }
    return exits;
  }
  /**
   * Animate the exit ghosts out, then remove them. Layouts whose positions carry
   * data (a waffle / grid lattice, or a scatter / beeswarm on real axes) fade
   * their ghosts OUT IN PLACE - drifting them toward the plot centre would drag
   * cells across tiles or bubbles across the plane, which reads as wrong. The
   * blob / bar layouts keep the gentle inward collapse so a removal reads as
   * motion rather than a pop.
   * @param {any} group @param {{x:number,y:number,fill:string,r?:number,spec?:any}[]} exits @param {any} opts
   */
  _runExits(group, exits, opts) {
    const w2 = this.w;
    const graphics = new Graphics(w2, this.ctx);
    const dotR = this._lastDotR;
    const cx = w2.layout.gridWidth / 2;
    const cy = w2.layout.gridHeight / 2;
    const drift = opts.layout === "grid" || opts.layout === "scatter" || opts.layout === "arc" || opts.layout === "custom" ? 0 : 0.35;
    const ghosts = [];
    exits.forEach((slot) => {
      const r = slot.r != null ? slot.r : dotR;
      const spec = slot.spec || this._baseSpec(opts, r);
      const el = this._drawDot(graphics, opts, r, slot.fill, 0, 0, spec);
      el.node.classList.add("apexcharts-unit-exit");
      this._place(el.node, spec, slot.x, slot.y);
      group.add(el);
      ghosts.push({ node: el.node, x0: slot.x, y0: slot.y, spec });
    });
    if (!this._shouldAnimate()) {
      ghosts.forEach((g2) => g2.node.remove());
      return;
    }
    const speed = Math.max(1, w2.config.chart.animations.speed || 800);
    if (this.w.globals.unitExitRAF != null) {
      BrowserAPIs.cancelAnimationFrame(this.w.globals.unitExitRAF);
      this.w.globals.unitExitRAF = null;
    }
    const start = performance.now();
    const stepFn = (now) => {
      if (this.w.globals.isDestroyed) {
        this.w.globals.unitExitRAF = null;
        return;
      }
      const t = Math.max(0, Math.min(1, (now - start) / speed));
      const e = easeOutCubic(t);
      for (let k = 0; k < ghosts.length; k++) {
        const g2 = ghosts[k];
        if (drift) {
          const x = g2.x0 + (cx - g2.x0) * e * drift;
          const y = g2.y0 + (cy - g2.y0) * e * drift;
          this._place(g2.node, g2.spec, x, y);
        }
        g2.node.style.opacity = String(1 - e);
      }
      if (t < 1) {
        this.w.globals.unitExitRAF = BrowserAPIs.requestAnimationFrame(stepFn);
      } else {
        this.w.globals.unitExitRAF = null;
        group.node && group.node.remove();
      }
    };
    this.w.globals.unitExitRAF = BrowserAPIs.requestAnimationFrame(stepFn);
  }
  /**
   * Are outer (name) labels on? Only for `layout: 'custom'`: they name a colour
   * BAND, so they need categories that occupy their own part of the shape. The
   * generated layouts (`packed`, `grid`) interleave categories, and the blob /
   * bar / arc layouts already carry a label of their own.
   * @param {any} opts
   */
  _outerLabelsOn(opts) {
    const cfg = opts.clusterLabels;
    return !!(opts.layout === "custom" && cfg && cfg.show !== false && cfg.external && cfg.external.show);
  }
  /**
   * One outer label's text, as lines. Two lines by default (name, then share),
   * which is what makes the label readable at a distance from the band it names.
   * A `clusterLabels.formatter` may return "\n"-separated text to control the
   * split, or a single line.
   * @param {number} i @param {number} value @param {number} total @param {any} opts
   * @returns {string[]}
   */
  _outerLabelLines(i, value, total, opts) {
    const w2 = this.w;
    const name = w2.seriesData.seriesNames[i] || `series-${i + 1}`;
    const percent = total > 0 ? value / total * 100 : 0;
    const cfg = opts.clusterLabels;
    const text = typeof cfg.formatter === "function" ? cfg.formatter(name, { seriesIndex: i, value, percent, w: w2 }) : `${name}
${percent.toFixed(1)}%`;
    return String(text).split("\n");
  }
  /**
   * Room one side has to give up: the widest label, plus the leader line, plus a
   * little air. Capped at a quarter of the plot so one long category name shrinks
   * its own label into the gutter instead of starving the shape.
   * @param {number[]} counts @param {any} opts
   * @returns {number}
   */
  _outerLabelGutter(counts, opts) {
    const w2 = this.w;
    const cfg = opts.clusterLabels;
    const conn = cfg.external.connector || {};
    const total = counts.reduce((a, b2) => a + b2, 0);
    const lines = [];
    counts.forEach((c, i) => {
      if (c > 0) lines.push(...this._outerLabelLines(i, c, total, opts));
    });
    if (!lines.length) return 0;
    const width = measureLabelWidth(w2, lines, {
      fontSize: cfg.fontSize,
      fontFamily: cfg.fontFamily || w2.config.chart.fontFamily
    });
    const gap = conn.gap != null ? conn.gap : 8;
    const length = conn.length != null ? conn.length : 22;
    const room = width + gap + length + 8 + Math.abs(parseFloat(cfg.external.offsetX) || 0);
    return Math.min(room, w2.layout.gridWidth * 0.25);
  }
  /**
   * Plan and draw the outer labels. A band's anchor is one of its own dots - the
   * outermost on the label's side, preferring dots near the band's middle - so
   * the leader line lands on the crowd rather than on a bounding box the viewer
   * cannot see.
   *
   * Sides: a silhouette ordered by rows stacks its categories vertically, so
   * their centroids share an x and the labels have to alternate left/right down
   * the shape. One ordered by columns spreads them horizontally, so each label
   * goes to the side its band is already on.
   *
   * @param {any} ret @param {{ i:number, cx:number, cy:number, dots:{x:number,y:number,r?:number}[] }[]} clusters
   * @param {number[]} counts @param {number} total @param {any} opts
   * @param {boolean} gathering true only when the dots are flying in from the
   *   centre (first render / cross-type morph). On an update the crowd is already
   *   on screen, so the labels must not wait for anything.
   */
  _drawOuterLabels(ret, clusters, counts, total, opts, gathering) {
    const w2 = this.w;
    if (!Environment.isBrowser()) return;
    const cfg = opts.clusterLabels;
    const ext = cfg.external;
    const conn = ext.connector || {};
    const gap = conn.gap != null ? conn.gap : 8;
    const length = conn.length != null ? conn.length : 22;
    const offsetX = parseFloat(ext.offsetX) || 0;
    const offsetY = parseFloat(ext.offsetY) || 0;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const dotR = this._lastDotR;
    const live = clusters.filter((c) => c.dots.length > 0);
    if (!live.length) return;
    let spreadX = 0;
    let spreadY = 0;
    if (live.length > 1) {
      const xs = live.map((c) => c.cx);
      const ys = live.map((c) => c.cy);
      spreadX = Math.max(...xs) - Math.min(...xs);
      spreadY = Math.max(...ys) - Math.min(...ys);
    }
    const bandedByX = spreadX > spreadY;
    const fontSize = parseFloat(cfg.fontSize) || 13;
    const lineHeight = Math.round(fontSize * 1.35);
    const items = [];
    live.slice().sort((a, b2) => a.cy - b2.cy).forEach((c, k) => {
      const lines = this._outerLabelLines(c.i, counts[c.i], total, opts);
      if (!lines.some((l) => l !== "")) return;
      const side = bandedByX ? c.cx >= gw / 2 ? "right" : "left" : k % 2 === 0 ? "right" : "left";
      const dir = side === "right" ? 1 : -1;
      let best = c.dots[0];
      let bestScore = -Infinity;
      c.dots.forEach((d) => {
        const score = dir * d.x - 0.75 * Math.abs(d.y - c.cy);
        if (score > bestScore) {
          bestScore = score;
          best = d;
        }
      });
      const anchor = { x: best.x + dir * (best.r || dotR), y: best.y };
      const elbow = { x: anchor.x + dir * gap, y: anchor.y };
      items.push({
        i: c.i,
        lines,
        anchor,
        elbow,
        labelX: elbow.x + dir * length + offsetX,
        idealY: anchor.y + offsetY,
        labelY: anchor.y + offsetY,
        side
      });
    });
    if (!items.length) return;
    const maxLines = items.reduce((m2, it) => Math.max(m2, it.lines.length), 1);
    const block = maxLines * lineHeight;
    const half = block / 2;
    ["left", "right"].forEach((side) => {
      spaceOutLabels(
        items.filter((it) => it.side === side),
        block + 2,
        gh - half,
        half
      );
    });
    const group = new Graphics(w2, this.ctx).group({
      class: "apexcharts-unit-outer-labels"
    });
    if (gathering) {
      const speed = Math.max(1, w2.config.chart.animations.speed || 800);
      group.node.classList.add("apexcharts-unit-label-delay");
      group.node.style.animationDelay = `${Math.min(speed * 0.45, 600) / 1e3}s`;
    }
    items.forEach((it) => {
      const color = w2.globals.colors[it.i] || w2.globals.colors[0] || "#008FFB";
      group.add(
        drawOuterLabel(w2, {
          lines: it.lines,
          lineHeight,
          anchor: it.anchor,
          elbow: it.elbow,
          labelX: it.labelX,
          labelY: it.labelY,
          side: it.side,
          connector: {
            show: conn.show !== false,
            width: conn.width != null ? conn.width : 1.5,
            color: conn.color || color
          },
          style: {
            fontSize: cfg.fontSize,
            fontFamily: cfg.fontFamily || w2.config.chart.fontFamily,
            fontWeight: cfg.fontWeight
          },
          foreColor: cfg.color || w2.config.chart.foreColor,
          groupClass: "apexcharts-unit-outer-label-group",
          textClass: "apexcharts-unit-outer-label",
          connectorClass: "apexcharts-unit-label-connector"
        })
      );
    });
    ret.add(group);
  }
  /**
   * A cluster label placed above (default) or below the cluster/bar. A TOP label
   * over a wide grouped/packed blob rides a curved arc (invisible arc path +
   * <textPath>, centred at 50% offset); a bottom label, a 'columns' bar, or a
   * cluster too small for the arc gets a straight centred label instead.
   * `clusterLabels.position` = 'top' | 'bottom'; `offsetY` pushes it further from
   * the blob in either direction.
   * @param {any} elSeries @param {{ i:number, cx:number, cy:number, outerR:number, flat?:boolean }} cluster
   * @param {number} value @param {number} total @param {any} opts @param {string} color
   */
  _drawClusterLabel(elSeries, cluster, value, total, opts, color) {
    const w2 = this.w;
    if (!Environment.isBrowser()) return;
    const NS = "http://www.w3.org/2000/svg";
    const name = w2.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`;
    const percent = total > 0 ? value / total * 100 : 0;
    const cfg = opts.clusterLabels;
    const fontSize = parseFloat(cfg.fontSize) || 13;
    let text;
    if (typeof cfg.formatter === "function") {
      text = cfg.formatter(name, {
        seriesIndex: cluster.i,
        value,
        percent,
        w: w2
      });
    } else {
      text = `${name} (${percent.toFixed(1)}%)`;
    }
    const str = typeof text === "string" ? text : String(text);
    const textEl = BrowserAPIs.createElementNS(NS, "text");
    textEl.setAttribute("class", "apexcharts-unit-label");
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute("font-size", `${fontSize}px`);
    textEl.setAttribute("font-family", cfg.fontFamily || w2.config.chart.fontFamily || "inherit");
    textEl.setAttribute("font-weight", String(cfg.fontWeight || 600));
    textEl.setAttribute("fill", cfg.color || color);
    const bottom = cfg.position === "bottom";
    const R = cluster.outerR + fontSize * 0.6 + 3 + (cfg.offsetY || 0);
    const estWidth = str.length * fontSize * 0.55;
    const curved = !bottom && !cluster.flat && cfg.curved !== false && estWidth <= Math.PI * R * 0.95;
    if (curved) {
      const yMid = cluster.cy;
      const x1 = cluster.cx - R;
      const x2 = cluster.cx + R;
      const d = `M ${x1} ${yMid} A ${R} ${R} 0 0 1 ${x2} ${yMid}`;
      const arcId = `apexcharts-unit-label-${w2.globals.chartID}-${cluster.i}`;
      const pathEl = BrowserAPIs.createElementNS(NS, "path");
      pathEl.setAttribute("id", arcId);
      pathEl.setAttribute("d", d);
      pathEl.setAttribute("fill", "none");
      pathEl.setAttribute("stroke", "none");
      const tp = BrowserAPIs.createElementNS(NS, "textPath");
      tp.setAttribute("href", `#${arcId}`);
      tp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${arcId}`);
      tp.setAttribute("startOffset", "50%");
      tp.textContent = str;
      textEl.appendChild(tp);
      elSeries.node.appendChild(pathEl);
    } else {
      textEl.setAttribute("x", String(cluster.cx));
      const y = bottom ? cluster.cy + cluster.outerR + fontSize + 6 + (cfg.offsetY || 0) : cluster.cy - cluster.outerR - 6 - (cfg.offsetY || 0);
      textEl.setAttribute("y", String(y));
      textEl.textContent = str;
    }
    elSeries.node.appendChild(textEl);
  }
}
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const SVGNS = "http://www.w3.org/2000/svg";
const XHTML = "http://www.w3.org/1999/xhtml";
const lerp = (a, b2, t) => a + (b2 - a) * t;
class SunburstChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.ctx = ctx;
    this.w = w2;
    const cnf = w2.config;
    this.cfg = cnf.plotOptions.sunburst;
    this.strokeWidth = cnf.stroke.show ? cnf.stroke.width : 0;
    this.strokeColor = Array.isArray(cnf.stroke.colors) ? cnf.stroke.colors[0] : cnf.stroke.colors || "#fff";
    this.startAngle = this.cfg.startAngle;
    this.endAngle = this.cfg.endAngle;
    this.maxDepth = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.maxRadius = 0;
    this.total = 1;
    this._focusMaxDepth = 0;
    this._focus = null;
    this._zoomGen = 0;
    this._roots = [];
    this._nodesAll = [];
    this._innerR = () => 0;
    this._outerR = () => 0;
    this._tooltipEl = null;
    this._lblSeq = 0;
    this._morphLeafIndex = 0;
    this._graphics = null;
    this._ringsG = null;
    this._labelsG = null;
  }
  /**
   * @param {any[]} series  flattened top-level values (geometry comes from the
   *   config hierarchy; kept for the standard draw(series) signature + noData)
   * @returns {any} SVG group
   */
  draw(series) {
    const w2 = this.w;
    const graphics = new Graphics(this.w);
    this._graphics = graphics;
    const g2 = graphics.group({ class: "apexcharts-sunburst" });
    if (w2.globals.noData || !series || !series.length) return g2;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    this.centerX = gw / 2 + (this.cfg.offsetX || 0);
    this.centerY = gh / 2 + (this.cfg.offsetY || 0);
    this.maxRadius = Math.min(gw, gh) / 2.05 - this.strokeWidth - (!w2.config.chart.sparkline.enabled ? w2.config.chart.dropShadow.blur : 0);
    if (this.maxRadius < 5) return g2;
    this._roots = this._buildHierarchy();
    if (!this._roots.length) return g2;
    this._roots.forEach((r) => this._fillValues(r));
    this._validateStrict();
    this._nodesAll = [];
    const colors = w2.globals.colors || [];
    this._roots.forEach((r, i) => {
      this._colorPass(r, r.color || colors[i % colors.length] || "#008FFB");
    });
    this.total = this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1;
    this._ringsG = graphics.group({ class: "apexcharts-sunburst-rings" });
    this._labelsG = graphics.group({ class: "apexcharts-sunburst-labels" });
    g2.add(this._ringsG);
    g2.add(this._labelsG);
    this._focus = null;
    this._relayout(this._focus);
    const anims = w2.config.chart.animations;
    let mode = "none";
    if (anims.enabled) {
      if (w2.globals.dataChanged) {
        if (anims.dynamicAnimation.enabled) mode = "update";
      } else if (!w2.globals.resized) {
        mode = "intro";
      }
    }
    this._applyLayout(mode);
    this._renderBreadcrumb();
    return g2;
  }
  // ------------------------------------------------------------------ data
  /**
   * Resolve the config into root nodes `{ name, value, color?, children? }`.
   * Each datum may carry `children` (native) or `drilldown: '<id>'` (adapter).
   * Shared with the treemap - see charts/common/Hierarchy.
   * @returns {any[]}
   */
  _buildHierarchy() {
    return buildHierarchy(this.w);
  }
  /**
   * Fill a parent's value from its children when missing.
   * @param {any} node
   */
  _fillValues(node) {
    fillValues(node);
  }
  /**
   * With `partition: 'strict'`, warn (once) when a parent's value does not
   * match the sum of its children. The angles are still normalized to fill the
   * wedge (strict rendering is a P3 refinement); this just surfaces the data
   * mismatch.
   */
  _validateStrict() {
    if (this.cfg.partition !== "strict") return;
    let warned = false;
    const walk = (node) => {
      if (node.children && node.children.length) {
        const sum = node.children.reduce(
          (s, c) => s + Math.max(0, c.value || 0),
          0
        );
        if (!warned && node.value != null && Math.abs(sum - node.value) > 0.5) {
          console.warn(
            `ApexCharts sunburst: partition 'strict' but "${node.name}" (${node.value}) != sum of its children (${sum}). Angles are normalized to fill the wedge.`
          );
          warned = true;
        }
        node.children.forEach(walk);
      }
    };
    this._roots.forEach(walk);
  }
  /**
   * Assign a colour to every node (explicit `color` wins, else the parent's
   * colour tinted lighter). Done once so zoom preserves colours.
   * @param {any} node
   * @param {string} color
   */
  _colorPass(node, color) {
    node._color = node.color || color;
    this._nodesAll.push(node);
    if (node.children) {
      node.children.forEach(
        (c) => this._colorPass(c, c.color || this._lighten(node._color, this.cfg.tint))
      );
    }
  }
  // ---------------------------------------------------------------- layout
  /**
   * Recompute visibility + angles + radii for a focus node (null = whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    this._nodesAll.forEach((n) => {
      n._show = false;
    });
    this._focusMaxDepth = 0;
    if (!focus) {
      const total = this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1;
      let a = this.startAngle;
      this._roots.forEach((r) => {
        const span = (this.endAngle - this.startAngle) * Math.max(0, r.value) / total;
        this._placeVis(r, 0, a, a + span, null);
        a += span;
      });
    } else {
      this._placeVis(focus, 0, this.startAngle, this.endAngle, focus._parent);
    }
    const hole = this._parseSize(this.cfg.innerSize, this.maxRadius);
    const ringCount = this._focusMaxDepth + 1;
    const band = (this.maxRadius - hole) / ringCount;
    const radialGap = ringCount > 1 ? 1 : 0;
    this._innerR = (vd) => hole + vd * band + (vd > 0 ? radialGap / 2 : 0);
    this._outerR = (vd) => hole + (vd + 1) * band - radialGap / 2;
    this._nodesAll.forEach((n) => {
      if (!n._show) return;
      n._iR = this._innerR(n._vDepth);
      n._oR = n._leaf && this.cfg.leaf === "extend" && n._vDepth < this._focusMaxDepth ? this.maxRadius : this._outerR(n._vDepth);
    });
  }
  /**
   * @param {any} node
   * @param {number} vDepth
   * @param {number} a0
   * @param {number} a1
   * @param {any} parent
   */
  _placeVis(node, vDepth, a0, a1, parent) {
    node._show = true;
    node._vDepth = vDepth;
    node._a0 = a0;
    node._a1 = a1;
    node._parent = parent;
    node._leaf = !(node.children && node.children.length);
    if (vDepth > this._focusMaxDepth) this._focusMaxDepth = vDepth;
    if (!node._leaf) {
      const total = node.children.reduce(
        (s, c) => s + Math.max(0, c.value),
        0
      ) || 1;
      let a = a0;
      node.children.forEach((c) => {
        const span = (a1 - a0) * Math.max(0, c.value) / total;
        this._placeVis(c, vDepth + 1, a, a + span, node);
        a += span;
      });
    }
  }
  // --------------------------------------------------------------- render
  /**
   * Create / update / remove arc elements to match the current layout, with an
   * animation appropriate to the transition:
   *   intro  — pie/donut-style angular clock sweep from startAngle to endAngle
   *            (all rings reveal together as the sweep line passes them)
   *   update — morph every arc from its previous on-screen geometry (matched
   *            by node key across the re-render); new arcs unfurl in place
   *   zoom   — tween angles + radii between focus layouts (same instance)
   * @param {'intro'|'zoom'|'update'|'none'} mode
   */
  _applyLayout(mode) {
    var _a;
    const w2 = this.w;
    const anims = w2.config.chart.animations;
    const dur = !anims.enabled ? 0 : mode === "none" ? 0 : mode === "update" ? anims.dynamicAnimation.speed || 350 : anims.speed || 500;
    const gen = ++this._zoomGen;
    const morph = (
      /** @type {any} */
      (_a = this.ctx) == null ? void 0 : _a.morphTypeChange
    );
    const morphActive = !!morph && typeof morph.isActive === "function" && morph.isActive() && typeof morph.getInitialPathAt === "function";
    const morphDur = morphActive ? morph.getSpeed() : 0;
    this._morphLeafIndex = 0;
    const prev = mode === "update" ? (
      /** @type {any} */
      this.ctx._sunburstPrevGeoms
    ) : null;
    this._nodesAll.forEach((node) => {
      if (node._show) {
        const target = {
          a0: node._a0,
          a1: node._a1,
          iR: node._iR,
          oR: node._oR
        };
        if (!node._el) node._el = this._createArcEl(node);
        const morphFrom = morphActive ? this._morphSourceFor(node) : null;
        if (morphFrom && morphDur > 0) {
          this._morphArcFrom(node, morphFrom, target, morphDur, gen);
        } else if ((mode === "intro" || morphActive) && dur > 0) {
          this._sweepArc(node, target, morphActive ? morphDur : dur, gen);
        } else {
          let from;
          let isNew = false;
          if (node._cur) {
            from = node._cur;
          } else if (prev && prev.get(node._key)) {
            from = prev.get(node._key);
          } else {
            const mid = (target.a0 + target.a1) / 2;
            from = { a0: mid, a1: mid, iR: target.iR, oR: target.iR };
            isNew = true;
          }
          this._animateArc(node, from, target, dur, false, isNew, gen);
        }
      } else if (node._el && node._cur) {
        const mid = (node._cur.a0 + node._cur.a1) / 2;
        const target = { a0: mid, a1: mid, iR: node._cur.iR, oR: node._cur.iR };
        this._animateArc(node, node._cur, target, dur, true, false, gen);
      }
    });
    const geoms = /* @__PURE__ */ new Map();
    this._nodesAll.forEach((n) => {
      if (n._show) {
        geoms.set(n._key, { a0: n._a0, a1: n._a1, iR: n._iR, oR: n._oR });
      }
    });
    this.ctx._sunburstPrevGeoms = geoms;
    this._renderLabels(dur);
  }
  /**
   * The captured mark this leaf should unroll from, or null when the node is
   * the outgoing chart had nothing to give it.
   *
   * When both charts carry branch keys the pairing is by identity, so EVERY
   * ring finds the tile that stood for the same branch and the inner rings
   * unroll instead of appearing from nothing.
   *
   * Without keys (a flat treemap, or an older config) only leaves pair, and
   * they consume the captured paths in draw order - the order the outgoing
   * renderer laid its own marks out in, so tile k pairs with leaf k.
   *
   * @param {any} node
   * @returns {string | null}
   */
  _morphSourceFor(node) {
    const ctx = (
      /** @type {any} */
      this.ctx
    );
    const morph = ctx && ctx.morphTypeChange;
    if (!morph) return null;
    if (typeof morph.hasKeyedMarks === "function" && morph.hasKeyedMarks() && typeof morph.getInitialPathForKey === "function") {
      return morph.getInitialPathForKey(morphKey(node._key));
    }
    if (node.children && node.children.length) return null;
    return morph.getInitialPathAt(this._morphLeafIndex++);
  }
  /**
   * Unroll an arc from an arbitrary captured shape.
   *
   * `_animateArc` interpolates arc PARAMETERS (angles and radii), which cannot
   * express a rectangle, so this one tweens the path data itself through
   * Animations.morphSVG - the same call every other morphing renderer makes,
   * which already selects the polygon-resample algorithm while a cross-type
   * morph is active.
   *
   * @param {any} node
   * @param {string} fromD
   * @param {{a0:number,a1:number,iR:number,oR:number}} target
   * @param {number} dur
   * @param {number} gen
   */
  _morphArcFrom(node, fromD, target, dur, gen) {
    const el = node._el;
    const toD = this._arcPath(
      target.iR,
      target.oR,
      target.a0,
      target.a1,
      this.cfg.borderRadius
    );
    el.node.style.display = "";
    el.attr({ d: fromD, opacity: 1 });
    node._cur = target;
    if (this._zoomGen !== gen) return;
    new Animations(
      this.w,
      /** @type {any} */
      this.ctx
    ).morphSVG(
      el,
      0,
      // Not a (series, point) index: an arc has no j, and passing a number here
      // would make morphSVG treat it as the last point of a series and fire the
      // chart's animation-completed hook.
      /** @type {any} */
      null,
      node._color,
      fromD,
      toD,
      dur,
      0
    );
  }
  /**
   * Pie/donut-style intro: a clock sweep from startAngle to endAngle. Each
   * arc's end angle is clamped to the sweep line, so arcs appear in angular
   * order and grow until complete — the whole hierarchy unwipes together.
   * @param {any} node
   * @param {{a0:number,a1:number,iR:number,oR:number}} target
   * @param {number} dur
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _sweepArc(node, target, dur, gen) {
    const el = node._el;
    const br = this.cfg.borderRadius;
    const s0 = this.startAngle;
    const s1 = this.endAngle;
    el.node.style.display = "";
    el.attr({ d: "", opacity: 1 });
    el.animate(dur).during((pos) => {
      if (this._zoomGen !== gen) return;
      const sweep = s0 + (s1 - s0) * pos;
      if (sweep <= target.a0 + 0.01) {
        el.attr({ d: "" });
        return;
      }
      const a1 = Math.min(target.a1, sweep);
      el.attr({ d: this._arcPath(target.iR, target.oR, target.a0, a1, br) });
      node._cur = { a0: target.a0, a1, iR: target.iR, oR: target.oR };
    }).after(() => {
      if (this._zoomGen !== gen) return;
      node._cur = target;
    });
  }
  /**
   * @param {any} node
   * @returns {any} svg.js path element
   */
  _createArcEl(node) {
    const path = this._graphics.drawPath({
      d: "",
      fill: node._color,
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
      fillOpacity: 1,
      classes: "apexcharts-sunburst-arc"
    });
    const el = path.node;
    el.setAttribute("data:name", node.name);
    el.setAttribute("data:value", String(node.value));
    el.setAttribute("data:key", morphKey(node._key));
    el.setAttribute(
      "data:leaf",
      String(!(node.children && node.children.length))
    );
    this._attachTooltip(el, node);
    if (Environment.isBrowser()) {
      el.addEventListener("click", () => this._zoomTo(node));
      el.style.cursor = "pointer";
    }
    this._ringsG.add(path);
    return path;
  }
  /**
   * @param {any} node
   * @param {{a0:number,a1:number,iR:number,oR:number}} from
   * @param {{a0:number,a1:number,iR:number,oR:number}} to
   * @param {number} dur
   * @param {boolean} hide    shrink + fade out, then hide
   * @param {boolean} fadeIn  fade 0 -> 1 (new arcs only; morphs stay opaque)
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _animateArc(node, from, to, dur, hide, fadeIn, gen) {
    const el = node._el;
    const br = this.cfg.borderRadius;
    el.attr({ fill: node._color });
    if (dur === 0) {
      el.attr({ d: this._arcPath(to.iR, to.oR, to.a0, to.a1, br), opacity: hide ? 0 : 1 });
      el.node.style.display = hide ? "none" : "";
      node._cur = hide ? null : to;
      return;
    }
    el.node.style.display = "";
    const startOp = hide ? Number(el.attr("opacity")) || 1 : fadeIn ? 0 : 1;
    const endOp = hide ? 0 : 1;
    el.attr({ opacity: startOp });
    el.animate(dur).during((pos) => {
      if (this._zoomGen !== gen) return;
      const a0 = lerp(from.a0, to.a0, pos);
      const a1 = lerp(from.a1, to.a1, pos);
      const iR = lerp(from.iR, to.iR, pos);
      const oR = lerp(from.oR, to.oR, pos);
      el.attr({
        d: this._arcPath(iR, oR, a0, a1, br),
        opacity: lerp(startOp, endOp, pos)
      });
      node._cur = { a0, a1, iR, oR };
    }).after(() => {
      if (this._zoomGen !== gen) return;
      if (hide) {
        el.node.style.display = "none";
        node._cur = null;
      } else {
        node._cur = to;
      }
    });
  }
  // ---------------------------------------------------------------- labels
  /**
   * Labels are overlays on animated paths, so they reveal gradually AFTER the
   * arcs settle (repo convention: overlays never pop in over a moving path).
   * @param {number} dur  arc animation duration (0 = instant labels)
   */
  _renderLabels(dur) {
    const labelsG = this._labelsG;
    while (labelsG.node.firstChild) labelsG.node.removeChild(labelsG.node.firstChild);
    if (!this.cfg.dataLabels.show) return;
    this._nodesAll.forEach((node) => {
      if (!node._show) return;
      if (node._a1 - node._a0 < this.cfg.dataLabels.minAngleToShow) return;
      this._renderCurvedLabel(node);
    });
    if (dur > 0) {
      labelsG.attr({ opacity: 0 });
      labelsG.animate(250, dur).attr({ opacity: 1 });
    } else {
      labelsG.attr({ opacity: 1 });
    }
  }
  /**
   * Curved label along the arc's mid-radius (flipped on the bottom half so it
   * stays upright). Raw SVG <textPath> — svg.js has no first-class textPath.
   * @param {any} node
   */
  _renderCurvedLabel(node) {
    if (!Environment.isBrowser()) return;
    const style = this.cfg.dataLabels.style;
    const w2 = this.w;
    const r = (node._iR + node._oR) / 2;
    const mid = (node._a0 + node._a1) / 2;
    const flip = mid > 90 && mid < 270;
    const padDeg = Math.min(r > 0 ? 4 / r * R2D : 0, (node._a1 - node._a0) / 2);
    const from = flip ? node._a1 - padDeg : node._a0 + padDeg;
    const to = flip ? node._a0 + padDeg : node._a1 - padDeg;
    const p1 = this._ptAt(r, from);
    const p2 = this._ptAt(r, to);
    const largeArc = Math.abs(to - from) > 180 ? 1 : 0;
    const sweep = flip ? 0 : 1;
    const id = `apx-sb-lbl-${w2.globals.cuid}-${this._lblSeq++}`;
    const guide = BrowserAPIs.createElementNS(SVGNS, "path");
    guide.setAttribute("id", id);
    guide.setAttribute(
      "d",
      `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`
    );
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", "none");
    const colors = style.colors;
    const fill = (Array.isArray(colors) ? colors[0] : colors) || "#fff";
    const text = BrowserAPIs.createElementNS(SVGNS, "text");
    text.setAttribute("font-size", style.fontSize || "12px");
    if (style.fontFamily) text.setAttribute("font-family", style.fontFamily);
    text.setAttribute("font-weight", String(style.fontWeight || 400));
    text.setAttribute("fill", fill);
    text.setAttribute("dominant-baseline", "central");
    text.style.pointerEvents = "none";
    const tp = BrowserAPIs.createElementNS(SVGNS, "textPath");
    tp.setAttribute("href", "#" + id);
    tp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + id);
    tp.setAttribute("startOffset", "50%");
    tp.setAttribute("text-anchor", "middle");
    tp.textContent = this._truncate(node.name, r, node._a1 - node._a0, style.fontSize);
    text.appendChild(tp);
    this._labelsG.node.appendChild(guide);
    this._labelsG.node.appendChild(text);
  }
  /**
   * Trim a label to the arc length available at its radius.
   * @param {string} name
   * @param {number} r
   * @param {number} spanDeg
   * @param {string} fontSize
   * @returns {string}
   */
  _truncate(name, r, spanDeg, fontSize) {
    const arcLen = r * spanDeg * D2R - 8;
    const charW = (parseFloat(fontSize) || 12) * 0.58;
    const maxChars = Math.floor(arcLen / charW);
    if (maxChars >= name.length) return name;
    if (maxChars <= 1) return "";
    return name.slice(0, Math.max(1, maxChars - 1)) + "…";
  }
  // ----------------------------------------------------------------- zoom
  /**
   * Focus a node (zoom in), or zoom out one level when the current focus (the
   * innermost ring) is clicked.
   * @param {any} node
   */
  _zoomTo(node) {
    if (this.cfg.zoomOnClick === false) return;
    const nextFocus = node === this._focus ? node._parent || null : node;
    if (nextFocus === this._focus) return;
    this._focus = nextFocus && !(nextFocus.children && nextFocus.children.length) ? nextFocus._parent || null : nextFocus;
    this._relayout(this._focus);
    this._applyLayout("zoom");
    this._renderBreadcrumb();
  }
  /** Root -> focus chain of nodes. */
  _focusChain() {
    const chain = [];
    let n = this._focus;
    while (n) {
      chain.unshift(n);
      n = n._parent;
    }
    return chain;
  }
  /**
   * Minimal self-contained breadcrumb (reuses the shared `.apexcharts-breadcrumb`
   * CSS classes, but does NOT depend on the drilldown feature).
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return;
    const w2 = this.w;
    const elWrap = w2.dom.elWrap;
    if (!elWrap) return;
    const existing = elWrap.querySelector(".apexcharts-breadcrumb");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    if (!this._focus) return;
    const nav = BrowserAPIs.createElementNS(XHTML, "nav");
    nav.setAttribute("class", "apexcharts-breadcrumb");
    nav.setAttribute("aria-label", "Sunburst breadcrumb");
    nav.style.position = "absolute";
    nav.style.top = "0px";
    nav.style.left = "0px";
    const crumbs = [{ name: "All", node: null }].concat(
      this._focusChain().map((n) => ({ name: n.name, node: n }))
    );
    crumbs.forEach((crumb, i) => {
      if (i > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML, "span");
        sep.setAttribute("class", "apexcharts-breadcrumb-separator");
        sep.textContent = " / ";
        nav.appendChild(sep);
      }
      const isCurrent = i === crumbs.length - 1;
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML, "span");
        cur.setAttribute(
          "class",
          "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
        );
        cur.textContent = crumb.name;
        nav.appendChild(cur);
      } else {
        const btn = BrowserAPIs.createElementNS(XHTML, "button");
        btn.setAttribute("type", "button");
        btn.setAttribute("class", "apexcharts-breadcrumb-item");
        if (i === 0) {
          const arrow = BrowserAPIs.createElementNS(XHTML, "span");
          arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
          arrow.textContent = "←";
          btn.appendChild(arrow);
        }
        const text = BrowserAPIs.createElementNS(XHTML, "span");
        text.setAttribute("class", "apexcharts-breadcrumb-label");
        text.textContent = crumb.name;
        btn.appendChild(text);
        btn.addEventListener("click", () => {
          this._focus = crumb.node;
          this._relayout(this._focus);
          this._applyLayout("zoom");
          this._renderBreadcrumb();
        });
        nav.appendChild(btn);
      }
    });
    elWrap.appendChild(nav);
    this._avoidChromeOverlap(nav);
  }
  /**
   * The breadcrumb is an absolute overlay at top-left, so it can sit on top of
   * a left-aligned title (or subtitle). After mounting, push it below any chart
   * chrome it intersects. (Duplicated from drilldown's Breadcrumb on purpose —
   * sunburst must not import the drilldown feature.)
   * @param {any} nav
   */
  /**
   * Shared with the treemap - see charts/common/Breadcrumb.
   * @param {any} nav
   */
  _avoidChromeOverlap(nav) {
    avoidChromeOverlap(this.w, nav);
  }
  // ------------------------------------------------------------ geometry
  /**
   * @param {number} r
   * @param {number} deg  0 = top, clockwise
   * @returns {{x: number, y: number}}
   */
  _ptAt(r, deg) {
    return {
      x: this.centerX + r * Math.cos((deg - 90) * D2R),
      y: this.centerY + r * Math.sin((deg - 90) * D2R)
    };
  }
  /**
   * Rounded donut-segment path (inner radius always > 0). Applies `spacing`
   * (angular gap) and `borderRadius` (corner rounding), both clamped so a thin
   * arc never inverts.
   * @param {number} iR
   * @param {number} oR
   * @param {number} a0
   * @param {number} a1
   * @param {number} borderRadius
   * @returns {string}
   */
  _arcPath(iR, oR, a0, a1, borderRadius) {
    if (oR <= iR + 0.01) return "";
    let spanDeg = a1 - a0;
    const spacing = this.cfg.spacing;
    if (spacing > 0 && spanDeg > 0 && oR > 0) {
      const gapDeg = spacing / oR * R2D;
      const inset = Math.min(gapDeg / 2, Math.max(0, spanDeg / 2 - 0.25));
      a0 += inset;
      a1 -= inset;
      spanDeg = a1 - a0;
    }
    if (spanDeg <= 0) return "";
    const spanRad = spanDeg * D2R;
    const cx = this.centerX;
    const cy = this.centerY;
    let r = borderRadius;
    r = Math.min(r, spanRad * iR / 2, spanRad * oR / 2, (oR - iR) / 2);
    if (!(r > 0.5)) {
      return sharpDonutSegmentPath({ cx, cy, rIn: iR, rOut: oR, a0, a1, spanDeg });
    }
    return roundedDonutSegmentPath({ cx, cy, rIn: iR, rOut: oR, a0, a1, r, spanDeg });
  }
  // ------------------------------------------------------------- tooltip
  /** @returns {any} */
  _tip() {
    if (!this._tooltipEl) {
      this._tooltipEl = this.w.dom.baseEl.querySelector(".apexcharts-tooltip");
    }
    return this._tooltipEl;
  }
  /**
   * @param {any} el
   * @param {any} node
   */
  _attachTooltip(el, node) {
    if (!this.w.config.tooltip.enabled || !Environment.isBrowser()) return;
    el.addEventListener(
      "mouseenter",
      (e) => this._showTooltip(e, node)
    );
    el.addEventListener(
      "mousemove",
      (e) => this._positionTooltip(e)
    );
    el.addEventListener("mouseleave", () => this._hideTooltip());
  }
  /**
   * @param {MouseEvent} e
   * @param {any} node
   */
  _showTooltip(e, node) {
    const t = this._tip();
    if (!t) return;
    const w2 = this.w;
    const pctTotal = (node.value / this.total * 100).toFixed(1);
    const parentVal = node._parent ? node._parent.value : this.total;
    const pctParent = parentVal > 0 ? (node.value / parentVal * 100).toFixed(1) : pctTotal;
    const groupBg = w2.config.tooltip.fillSeriesColor ? `background-color:${node._color};` : "";
    t.innerHTML = `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}"><span class="apexcharts-tooltip-marker" style="background-color:${node._color}"></span><div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${node.name}: </span><span class="apexcharts-tooltip-text-y-value">${node.value} (${pctParent}% of parent, ${pctTotal}% of total)</span></div></div></div>`;
    t.classList.add("apexcharts-active");
    t.style.opacity = "1";
    this._positionTooltip(e);
  }
  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  _positionTooltip(e) {
    const t = this._tip();
    if (!t) return;
    const rect = this.w.dom.elWrap.getBoundingClientRect();
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    const pad = 12;
    let x = e.clientX - rect.left + pad;
    if (x + tw > rect.width) x = e.clientX - rect.left - tw - pad;
    x = Math.max(0, Math.min(x, rect.width - tw));
    let y = e.clientY - rect.top + pad;
    if (y + th > rect.height) y = e.clientY - rect.top - th - pad;
    y = Math.max(0, Math.min(y, rect.height - th));
    t.style.left = x + "px";
    t.style.top = y + "px";
  }
  _hideTooltip() {
    const t = this._tip();
    if (!t) return;
    t.classList.remove("apexcharts-active");
    t.style.opacity = "0";
  }
  // --------------------------------------------------------------- utils
  /**
   * @param {string|number} size
   * @param {number} max
   * @returns {number}
   */
  _parseSize(size, max) {
    if (typeof size === "number") return size;
    const s = String(size).trim();
    if (s.endsWith("%")) return parseFloat(s) / 100 * max;
    const n = parseFloat(s);
    return isNaN(n) ? 0.15 * max : n;
  }
  /**
   * Blend a hex colour toward white by `amount` (0..1). Non-hex returned as-is.
   * @param {string} color
   * @param {number} amount
   * @returns {string}
   */
  _lighten(color, amount) {
    if (typeof color !== "string" || color[0] !== "#") return color;
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length !== 6) return color;
    const num = parseInt(hex, 16);
    if (isNaN(num)) return color;
    let rC = num >> 16 & 255;
    let gC = num >> 8 & 255;
    let bC = num & 255;
    rC = Math.round(rC + (255 - rC) * amount);
    gC = Math.round(gC + (255 - gC) * amount);
    bC = Math.round(bC + (255 - bC) * amount);
    return "#" + ((1 << 24) + (rC << 16) + (gC << 8) + bC).toString(16).slice(1);
  }
}
_core__default.use({
  line: Line,
  area: Line,
  scatter: Line,
  bubble: Line,
  rangeArea: Line,
  bar: Bar,
  column: Bar,
  barStacked: BarStacked,
  rangeBar: RangeBar,
  candlestick: BoxCandleStick,
  boxPlot: BoxCandleStick,
  violin: Violin,
  pie: Pie,
  donut: Pie,
  polarArea: Pie,
  radialBar: Radial,
  radar: Radar,
  heatmap: HeatMap,
  treemap: TreemapChart,
  unit: Unit,
  sunburst: SunburstChart
});
Object.defineProperty(_core__default, "__internals", {
  value: coreInternals,
  enumerable: false,
  writable: false,
  configurable: false
});
export {
  default2 as default
};
