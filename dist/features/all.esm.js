var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a2, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b) => __defProps(a2, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e2) {
        reject(e2);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e2) {
        reject(e2);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v6.9.0
 * (c) 2018-2026 ApexCharts
 */
import * as ApexCharts from "apexcharts/core";
import ApexCharts__default from "apexcharts/core";
const AxesUtils = ApexCharts.__apex_axes_AxesUtils;
const Data = ApexCharts.__apex_Data;
const Series = ApexCharts.__apex_Series;
const Utils = ApexCharts.__apex_Utils;
const Environment = ApexCharts.__apex_Environment_Environment;
const BrowserAPIs = ApexCharts.__apex_BrowserAPIs_BrowserAPIs;
const SVGNS = ApexCharts.__apex_math_SVGNS;
class Exports {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
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
    const w = this.w;
    const XLINK = "http://www.w3.org/1999/xlink";
    const origCanvases = w.dom.elWrap.querySelectorAll(
      ".apexcharts-series-canvas"
    );
    if (!origCanvases.length) return;
    const clonedFOs = clonedNode.querySelectorAll(".apexcharts-canvas-series");
    for (let i2 = 0; i2 < origCanvases.length && i2 < clonedFOs.length; i2++) {
      let dataURL;
      try {
        dataURL = /** @type {HTMLCanvasElement} */
        origCanvases[i2].toDataURL();
      } catch (e2) {
        continue;
      }
      const fo = clonedFOs[i2];
      const img = document.createElementNS(SVGNS, "image");
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
    const w = this.w;
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
    if (!w.config.legend.show || !w.dom.elLegendWrap || !w.dom.elLegendWrap.children.length) {
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
    const w = this.w;
    const bg = w.config.chart.background;
    if (bg && bg !== "transparent") return bg;
    return w.config.theme.mode === "dark" ? "#343A3F" : "#fff";
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
    const w = this.w;
    if (!Environment.isBrowser() || !w.dom.elWrap) return families;
    const els = this.queryStyleable(
      w.dom.elWrap,
      "text, tspan, .apexcharts-legend-text, .apexcharts-title-text, .apexcharts-subtitle-text"
    );
    const all = [w.dom.elWrap, ...els];
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
        const m = css.match(/font-family\s*:\s*([^;}]+)/i);
        if (!m) return;
        const family = m[1].trim().replace(/^['"]|['"]$/g, "");
        found.push({ family: family.toLowerCase(), css });
      });
    };
    const sheets = Array.from(document.styleSheets || []);
    sheets.forEach((sheet) => {
      let rules = null;
      try {
        rules = sheet.cssRules;
      } catch (e2) {
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
          fetch(sheet.href).then((r2) => r2.ok ? r2.text() : "").then(pushFromText).catch(() => {
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
    const w = this.w;
    if (!Environment.isBrowser() || !w.config.chart.toolbar.export.embedFonts || typeof fetch !== "function") {
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
      const style = document.createElementNS(SVGNS, "style");
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
    let m;
    while ((m = re.exec(css)) !== null) {
      if (!m[2].startsWith("data:")) urls.push(m[2]);
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
        for (let i2 = 0; i2 < bytes.length; i2 += CHUNK) {
          binary += String.fromCharCode.apply(
            null,
            /** @type {any} */
            bytes.subarray(i2, i2 + CHUNK)
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
      const w = this.w;
      let scale = _scale || w.config.chart.toolbar.export.scale || w.config.chart.toolbar.export.width / w.globals.svgWidth;
      if (!scale) {
        scale = 1;
      }
      const width = w.globals.svgWidth * scale;
      const height = w.globals.svgHeight * scale;
      const clonedNode = (
        /** @type {HTMLElement} */
        w.dom.elWrap.cloneNode(true)
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
          width="${w.globals.svgWidth}px" height="${w.globals.svgHeight}px">
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
      const w = this.w;
      const scale = options ? options.scale || options.width / w.globals.svgWidth : 1;
      const canvas = document.createElement("canvas");
      canvas.width = w.globals.svgWidth * scale;
      canvas.height = parseInt(w.dom.elWrap.style.height, 10) * scale;
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
    const w = this.w;
    if (!series) series = w.config.series;
    let columns = [];
    const rows = [];
    let result = "";
    const universalBOM = "\uFEFF";
    const gSeries = w.seriesData.series.map((s2, i2) => {
      return w.globals.collapsedSeriesIndices.indexOf(i2) === -1 ? s2 : [];
    });
    const csvSafe = (val) => {
      if (val == null || Utils.isNumber(val)) return val;
      const s2 = String(val);
      return /^[=+\-@\t\r]/.test(s2) ? `'${s2}` : s2;
    };
    const getFormattedCategory = (cat) => {
      if (typeof w.config.chart.toolbar.export.csv.categoryFormatter === "function") {
        return w.config.chart.toolbar.export.csv.categoryFormatter(cat);
      }
      if (w.config.xaxis.type === "datetime" && String(cat).length >= 10) {
        return new Date(cat).toDateString();
      }
      return Utils.isNumber(cat) ? cat : csvSafe(cat.split(columnDelimiter).join(""));
    };
    const getFormattedValue = (value) => {
      return typeof w.config.chart.toolbar.export.csv.valueFormatter === "function" ? w.config.chart.toolbar.export.csv.valueFormatter(value) : csvSafe(value);
    };
    const seriesMaxDataLength = Math.max(
      ...series.map((s2) => {
        return s2.data ? s2.data.length : 0;
      })
    );
    const dataFormat = new Data(this.w);
    const axesUtils = new AxesUtils(this.w, {
      theme: this.ctx.theme,
      timeScale: this.ctx.timeScale
    });
    const getCat = (i2) => {
      let cat = "";
      if (!w.globals.axisCharts) {
        cat = w.config.labels[i2];
      } else {
        if (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) {
          if (w.globals.isBarHorizontal) {
            const lbFormatter = w.formatters.yLabelFormatters[0];
            const sr = new Series(this.ctx.w);
            const activeSeries = sr.getActiveConfigSeriesIndex();
            cat = lbFormatter(w.labelData.labels[i2], {
              seriesIndex: activeSeries,
              dataPointIndex: i2,
              w
            });
          } else {
            cat = axesUtils.getLabel(
              w.labelData.labels,
              w.labelData.timescaleLabels,
              0,
              i2
            ).text;
          }
        }
        if (w.config.xaxis.type === "datetime") {
          if (w.config.xaxis.categories.length) {
            cat = w.config.xaxis.categories[i2];
          } else if (w.config.labels.length) {
            cat = w.config.labels[i2];
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
    const handleAxisRowsColumns = (s2, sI) => {
      var _a, _b, _c, _d, _e, _f;
      if (columns.length && sI === 0) {
        rows.push(columns.join(columnDelimiter));
      }
      if (s2.data) {
        const rowData = s2.data.length ? s2.data : getEmptyDataForCsvColumn();
        for (let i2 = 0; i2 < rowData.length; i2++) {
          columns = [];
          let cat = getCat(i2);
          if (cat === "nullvalue") continue;
          if (!cat) {
            if (dataFormat.isFormatXY()) {
              cat = series[sI].data[i2].x;
            } else if (dataFormat.isFormat2DArray()) {
              cat = series[sI].data[i2] ? series[sI].data[i2][0] : "";
            }
          }
          if (sI === 0) {
            columns.push(getFormattedCategory(cat));
            for (let ci = 0; ci < w.seriesData.series.length; ci++) {
              const value = dataFormat.isFormatXY() ? (_a = series[ci].data[i2]) == null ? void 0 : _a.y : gSeries[ci][i2];
              columns.push(getFormattedValue(value));
            }
          }
          if (w.config.chart.type === "candlestick" || s2.type && s2.type === "candlestick") {
            columns.pop();
            columns.push(w.candleData.seriesCandleO[sI][i2]);
            columns.push(w.candleData.seriesCandleH[sI][i2]);
            columns.push(w.candleData.seriesCandleL[sI][i2]);
            columns.push(w.candleData.seriesCandleC[sI][i2]);
          }
          if (w.config.chart.type === "boxPlot" || s2.type && s2.type === "boxPlot") {
            columns.pop();
            columns.push(w.candleData.seriesCandleO[sI][i2]);
            columns.push(w.candleData.seriesCandleH[sI][i2]);
            columns.push(w.candleData.seriesCandleM[sI][i2]);
            columns.push(w.candleData.seriesCandleL[sI][i2]);
            columns.push(w.candleData.seriesCandleC[sI][i2]);
          }
          if (w.config.chart.type === "rangeBar") {
            columns.pop();
            columns.push(w.rangeData.seriesRangeStart[sI][i2]);
            columns.push(w.rangeData.seriesRangeEnd[sI][i2]);
          }
          if (w.config.chart.type === "violin" || s2.type && s2.type === "violin") {
            columns.pop();
            columns.push((_b = w.violinData.seriesViolinMin[sI]) == null ? void 0 : _b[i2]);
            columns.push((_c = w.violinData.seriesViolinMax[sI]) == null ? void 0 : _c[i2]);
            columns.push((_f = (_e = (_d = w.violinData.seriesViolinPoints[sI]) == null ? void 0 : _d[i2]) == null ? void 0 : _e.length) != null ? _f : 0);
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
      series.forEach((s2, sI) => {
        s2 == null ? void 0 : s2.data.forEach((dataItem) => {
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
    columns.push(w.config.chart.toolbar.export.csv.headerCategory);
    if (w.config.chart.type === "boxPlot") {
      columns.push("minimum");
      columns.push("q1");
      columns.push("median");
      columns.push("q3");
      columns.push("maximum");
    } else if (w.config.chart.type === "candlestick") {
      columns.push("open");
      columns.push("high");
      columns.push("low");
      columns.push("close");
    } else if (w.config.chart.type === "rangeBar") {
      columns.push("minimum");
      columns.push("maximum");
    } else if (w.config.chart.type === "violin") {
      columns.push("minimum");
      columns.push("maximum");
      columns.push("observations");
    } else {
      series.map((s2, sI) => {
        const sname = (s2.name ? s2.name : `series-${sI}`) + "";
        if (w.globals.axisCharts) {
          columns.push(
            sname.split(columnDelimiter).join("") ? sname.split(columnDelimiter).join("") : `series-${sI}`
          );
        }
      });
    }
    if (!w.globals.axisCharts) {
      columns.push(w.config.chart.toolbar.export.csv.headerValue);
      rows.push(columns.join(columnDelimiter));
    }
    if (!w.globals.allSeriesHasEqualX && w.globals.axisCharts && !w.config.xaxis.categories.length && !w.config.labels.length) {
      handleUnequalXValues();
    } else {
      series.map((s2, sI) => {
        if (w.globals.axisCharts) {
          handleAxisRowsColumns(s2, sI);
        } else {
          columns = [];
          columns.push(getFormattedCategory(w.labelData.labels[sI]));
          columns.push(getFormattedValue(gSeries[sI]));
          rows.push(columns.join(columnDelimiter));
        }
      });
    }
    result += rows.join(lineDelimiter);
    this.triggerDownload(
      "data:text/csv; charset=utf-8," + encodeURIComponent(universalBOM + result),
      fileName ? fileName : w.config.chart.toolbar.export.csv.filename,
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
ApexCharts__default.registerFeatures({ exports: Exports });
const CoreUtils = ApexCharts.__apex_CoreUtils;
const Dimensions = ApexCharts.__apex_dimensions_Dimensions;
const Graphics = ApexCharts.__apex_Graphics;
const apexchartsLegendCSS = ".apexcharts-flip-y {\n  transform: scaleY(-1) translateY(-100%);\n  transform-origin: top;\n  transform-box: fill-box;\n}\n.apexcharts-flip-x {\n  transform: scaleX(-1);\n  transform-origin: center;\n  transform-box: fill-box;\n}\n.apexcharts-legend {\n  display: flex;\n  overflow: auto;\n  padding: 0 10px;\n}\n.apexcharts-legend.apexcharts-legend-group-horizontal {\n  flex-direction: column;\n}\n.apexcharts-legend-group {\n  display: flex;\n}\n.apexcharts-legend-group-vertical {\n  flex-direction: column-reverse;\n}\n.apexcharts-legend.apx-legend-position-bottom, .apexcharts-legend.apx-legend-position-top {\n  flex-wrap: wrap\n}\n.apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  flex-direction: column;\n  bottom: 0;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-left, .apexcharts-legend.apx-legend-position-top.apexcharts-align-left, .apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  justify-content: flex-start;\n  align-items: flex-start;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-center, .apexcharts-legend.apx-legend-position-top.apexcharts-align-center {\n  justify-content: center;\n  align-items: center;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-right, .apexcharts-legend.apx-legend-position-top.apexcharts-align-right {\n  justify-content: flex-end;\n  align-items: flex-end;\n}\n.apexcharts-legend-series {\n  cursor: pointer;\n  line-height: normal;\n  display: flex;\n  align-items: center;\n}\n.apexcharts-legend-text {\n  position: relative;\n  font-size: 14px;\n}\n.apexcharts-legend-text *, .apexcharts-legend-marker * {\n  pointer-events: none;\n}\n.apexcharts-legend-marker {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  margin-right: 1px;\n}\n\n.apexcharts-legend-series.apexcharts-no-click {\n  cursor: auto;\n}\n.apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series {\n  display: none !important;\n}\n.apexcharts-inactive-legend {\n  opacity: 0.45;\n} ";
let Helpers$1 = class Helpers {
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
    const w = this.w;
    const currLegendsWrap = w.dom.baseEl.querySelector(".apexcharts-legend");
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
    const w = this.w;
    if (w.globals.axisCharts || w.config.chart.type === "radialBar") {
      w.globals.resized = true;
      let seriesEl = null;
      let realIndex = null;
      w.globals.risingSeries = [];
      if (w.globals.axisCharts) {
        seriesEl = (_a = Array.prototype.find.call(
          w.dom.baseEl.querySelectorAll(".apexcharts-series"),
          (el) => el.getAttribute("data:realIndex") === String(seriesCnt)
        )) != null ? _a : null;
        if (!seriesEl) return;
        realIndex = parseInt((_b = seriesEl.getAttribute("data:realIndex")) != null ? _b : "", 10);
      } else {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        );
        if (!seriesEl) return;
        realIndex = parseInt((_c = seriesEl.getAttribute("rel")) != null ? _c : "", 10) - 1;
      }
      if (isHidden) {
        const seriesToMakeVisible = [
          {
            cs: w.globals.collapsedSeries,
            csi: w.globals.collapsedSeriesIndices
          },
          {
            cs: w.globals.ancillaryCollapsedSeries,
            csi: w.globals.ancillaryCollapsedSeriesIndices
          }
        ];
        seriesToMakeVisible.forEach((r2) => {
          const cs = (
            /** @type {any} */
            r2.cs
          );
          const csi = (
            /** @type {any} */
            r2.csi
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
      if (w.config.chart.accessibility.enabled) {
        const legendItem = w.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`
        );
        if (legendItem) {
          const isCollapsed = w.globals.collapsedSeriesIndices.includes(realIndex) || w.globals.ancillaryCollapsedSeriesIndices.includes(realIndex);
          legendItem.setAttribute(
            "aria-pressed",
            isCollapsed ? "true" : "false"
          );
          const legendTextEl = legendItem.querySelector(
            ".apexcharts-legend-text"
          );
          const seriesName = legendTextEl ? legendTextEl.textContent : w.seriesData.seriesNames[seriesCnt];
          const statusText = isCollapsed ? "hidden" : "visible";
          legendItem.setAttribute(
            "aria-label",
            `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
          );
        }
      }
    } else {
      w.globals.resized = true;
      w.globals.risingSeries = [];
      if (isHidden) {
        this.riseCollapsedSeries(
          w.globals.collapsedSeries,
          w.globals.collapsedSeriesIndices,
          seriesCnt
        );
      } else {
        const series = this.getSeriesAfterCollapsing({ realIndex: seriesCnt });
        this.lgCtx.updateSeries(
          series,
          w.config.chart.animations.dynamicAnimation.enabled
        );
      }
      if (w.config.chart.accessibility.enabled) {
        const legendItem = w.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`
        );
        if (legendItem) {
          const isCollapsed = w.globals.collapsedSeriesIndices.includes(seriesCnt);
          legendItem.setAttribute(
            "aria-pressed",
            isCollapsed ? "true" : "false"
          );
          const legendTextEl = legendItem.querySelector(
            ".apexcharts-legend-text"
          );
          const seriesName = legendTextEl ? legendTextEl.textContent : w.seriesData.seriesNames[seriesCnt];
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
  _writeSliceValue(container, i2, value) {
    const entry = container[i2];
    if (this.w.config.chart.type === "unit" && entry && Array.isArray(entry.data)) {
      entry.data = Array.isArray(value) ? value : [];
      return;
    }
    if (entry && typeof entry === "object") {
      entry.y = value;
    } else {
      container[i2] = value;
    }
  }
  /** @param {{realIndex: any}} opts */
  getSeriesAfterCollapsing({ realIndex }) {
    var _a, _b;
    const w = this.w;
    const gl = w.globals;
    const series = Utils.clone(w.config.series);
    if (gl.axisCharts) {
      const yaxis = w.config.yaxis[gl.seriesYAxisReverseMap[realIndex]];
      const collapseData = {
        index: realIndex,
        data: series[realIndex].data.slice(),
        type: series[realIndex].type || w.config.chart.type,
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
            (_b = (_a = w.config.series[realIndex]) == null ? void 0 : _a.type) != null ? _b : "line"
          ),
          // Pin the hide by category name so it survives a regroup (see above).
          name: (gl.seriesNames || [])[realIndex]
        });
        gl.collapsedSeriesIndices.push(realIndex);
      }
    }
    const seriesCount = gl.axisCharts ? w.config.series.length : this._nonAxisSliceContainer(series).length;
    gl.allSeriesCollapsed = gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length === seriesCount;
    return this._getSeriesBasedOnCollapsedState(series);
  }
  /** @param {{seriesEl: any, realIndex: any}} opts */
  hideSeries({ seriesEl, realIndex }) {
    const w = this.w;
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
    this.lgCtx.updateSeries(
      series,
      w.config.chart.animations.dynamicAnimation.enabled
    );
  }
  /**
   * @param {any[]} collapsedSeries
   * @param {number[]} seriesIndices
   * @param {number} realIndex
   */
  riseCollapsedSeries(collapsedSeries, seriesIndices, realIndex) {
    const w = this.w;
    let series = Utils.clone(w.config.series);
    if (collapsedSeries.length > 0) {
      for (let c2 = 0; c2 < collapsedSeries.length; c2++) {
        if (collapsedSeries[c2].index === realIndex) {
          if (w.globals.axisCharts) {
            series[realIndex].data = collapsedSeries[c2].data.slice();
            series[realIndex].hidden = false;
          } else {
            const container = this._nonAxisSliceContainer(series);
            this._writeSliceValue(container, realIndex, collapsedSeries[c2].data);
          }
          collapsedSeries.splice(c2, 1);
          seriesIndices.splice(c2, 1);
          w.globals.risingSeries.push(realIndex);
          c2--;
        }
      }
      series = this._getSeriesBasedOnCollapsedState(series);
      this.lgCtx.updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
    }
  }
  /**
   * @param {any[]} series
   */
  _getSeriesBasedOnCollapsedState(series) {
    const w = this.w;
    let collapsed = 0;
    if (w.globals.axisCharts) {
      series.forEach((s2, sI) => {
        if (!(w.globals.collapsedSeriesIndices.indexOf(sI) < 0 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(sI) < 0)) {
          series[sI].data = [];
          collapsed++;
        }
      });
    } else {
      const container = this._nonAxisSliceContainer(series);
      container.forEach((s2, sI) => {
        if (!(w.globals.collapsedSeriesIndices.indexOf(sI) < 0)) {
          this._writeSliceValue(container, sI, 0);
          collapsed++;
        }
      });
    }
    const seriesCount = w.globals.axisCharts ? series.length : this._nonAxisSliceContainer(series).length;
    w.globals.allSeriesCollapsed = collapsed === seriesCount;
    return series;
  }
};
const DEFAULT_DIVERGING = ["#cf4d3f", "#8f9499", "#26a75b"];
const lerp = (a2, b, t2) => a2 + (b - a2) * t2;
function toHexPair(n2) {
  const v = Math.max(0, Math.min(255, Math.round(n2)));
  return v.toString(16).padStart(2, "0");
}
function mixColors(c1, c2, t2) {
  const a2 = Utils.parseHex(normalizeHex(c1));
  const b = Utils.parseHex(normalizeHex(c2));
  if (!a2 || !b) return c1;
  return "#" + toHexPair(lerp(a2[0], b[0], t2)) + toHexPair(lerp(a2[1], b[1], t2)) + toHexPair(lerp(a2[2], b[2], t2));
}
function normalizeHex(c2) {
  if (typeof c2 !== "string") return "#000000";
  if (Utils.isColorHex(c2)) return c2;
  const asHex = Utils.rgb2hex(c2);
  return asHex || "#000000";
}
function colorValueOf(w, i2, j) {
  const series = (
    /** @type {any} */
    w.config.series[i2]
  );
  const datum = series && Array.isArray(series.data) ? series.data[j] : null;
  return colorValueOfDatum(w, datum, i2, j);
}
function colorValueOfDatum(w, datum, i2, j) {
  var _a, _b, _c;
  if (!datum || typeof datum !== "object") return null;
  const accessor = (_c = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.treemap) == null ? void 0 : _b.colorScale) == null ? void 0 : _c.colorValue;
  let raw;
  if (typeof accessor === "function") {
    raw = accessor(datum, { seriesIndex: i2, dataPointIndex: j, w });
  } else if (typeof accessor === "string") {
    raw = datum[accessor];
  } else {
    raw = datum.colorValue;
  }
  if (raw == null) return null;
  const n2 = Number(raw);
  return Number.isFinite(n2) ? n2 : null;
}
function resolveStops(cfg, min, max, midpoint) {
  if (Array.isArray(cfg.stops) && cfg.stops.length >= 2) {
    return cfg.stops.filter((s2) => s2 && Number.isFinite(Number(s2.value))).map((s2) => ({
      value: Number(s2.value),
      color: normalizeHex(s2.color)
    })).sort(
      (a2, b) => a2.value - b.value
    );
  }
  const colors = (Array.isArray(cfg.colors) && cfg.colors.length >= 2 ? cfg.colors : DEFAULT_DIVERGING).map(normalizeHex);
  const n2 = colors.length;
  if (midpoint != null && n2 >= 3) {
    const mid = Math.floor((n2 - 1) / 2);
    const out = [];
    for (let k = 0; k <= mid; k++) {
      out.push({ value: lerp(min, midpoint, k / mid), color: colors[k] });
    }
    for (let k = mid + 1; k < n2; k++) {
      out.push({
        value: lerp(midpoint, max, (k - mid) / (n2 - 1 - mid)),
        color: colors[k]
      });
    }
    return out;
  }
  return colors.map((c2, k) => ({
    value: lerp(min, max, k / (n2 - 1)),
    color: c2
  }));
}
function buildContinuousScale(w) {
  var _a, _b, _c;
  const cs = (_c = (_b = (_a = w.config) == null ? void 0 : _a.plotOptions) == null ? void 0 : _b.treemap) == null ? void 0 : _c.colorScale;
  const cfg = cs && cs.gradient;
  if (!cfg) return null;
  if (cfg.enabled === false) return null;
  const series = (
    /** @type {any} */
    w.config.series || []
  );
  let dataMin = Infinity;
  let dataMax = -Infinity;
  let found = false;
  for (let i2 = 0; i2 < series.length; i2++) {
    const data = series[i2] && series[i2].data;
    if (!Array.isArray(data)) continue;
    for (let j = 0; j < data.length; j++) {
      const v = colorValueOfDatum(w, data[j], i2, j);
      if (v == null) continue;
      found = true;
      if (v < dataMin) dataMin = v;
      if (v > dataMax) dataMax = v;
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
  const at = (v) => {
    if (!Number.isFinite(v)) return stops[Math.floor(stops.length / 2)].color;
    if (v <= stops[0].value) return stops[0].color;
    const last = stops[stops.length - 1];
    if (v >= last.value) return last.color;
    for (let k = 1; k < stops.length; k++) {
      const hi = stops[k];
      if (v <= hi.value) {
        const lo = stops[k - 1];
        const span2 = hi.value - lo.value;
        const t2 = span2 === 0 ? 0 : (v - lo.value) / span2;
        return mixColors(lo.color, hi.color, t2);
      }
    }
    return last.color;
  };
  const span = max - min;
  const legendStops = stops.map((s2) => ({
    percent: span === 0 ? 0 : (s2.value - min) / span,
    color: s2.color
  }));
  return { min, max, midpoint, stops, at, legendStops };
}
const SVG_NS = "http://www.w3.org/2000/svg";
class HeatmapGradientLegend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.svgEl = null;
    this.arrowEl = null;
    this.hoverValueEl = null;
    this._min = 0;
    this._max = 0;
    this._geom = null;
    this._bandHitEls = [];
    this._activeBandIndex = -1;
    this._onCellEnter = this._onCellEnter.bind(this);
    this._onCellLeave = this._onCellLeave.bind(this);
    this._onBandEnter = this._onBandEnter.bind(this);
    this._onBandLeave = this._onBandLeave.bind(this);
  }
  /** Default value formatter for min/max labels and the hover tooltip. */
  _getFormatter() {
    const cfg = this._cfg();
    if (typeof cfg.formatter === "function") return cfg.formatter;
    return (v) => {
      if (!Number.isFinite(v)) return String(v);
      const abs = Math.abs(v);
      if (abs >= 1e3) return v.toFixed(0);
      if (abs >= 10) return v.toFixed(1);
      return v.toFixed(2);
    };
  }
  /**
   * The colorScale of whichever chart type is being drawn. Every chart type
   * that encodes a value as colour carries the same `colorScale` shape, so one
   * strip serves them all rather than a near-copy per type.
   * @param {any} w
   */
  static colorScaleOf(w) {
    var _a, _b, _c, _d, _e;
    const type = (_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    if (!type) return null;
    return ((_e = (_d = (_c = w == null ? void 0 : w.config) == null ? void 0 : _c.plotOptions) == null ? void 0 : _d[type]) == null ? void 0 : _e.colorScale) || null;
  }
  /**
   * @param {any} w
   */
  static configFor(w) {
    const cs = HeatmapGradientLegend.colorScaleOf(w);
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
  static isEnabled(w) {
    if (!HeatmapGradientLegend.supports(w)) return false;
    const cfg = HeatmapGradientLegend.configFor(w);
    return !!(cfg && cfg.enabled);
  }
  /**
   * Chart types this legend can serve: those that encode a value as colour
   * through a `colorScale`. Everything else gets the categorical legend.
   * @param {any} w
   */
  static supports(w) {
    var _a, _b;
    const type = (_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    return type === "heatmap" || type === "treemap";
  }
  /**
   * Build the gradient legend DOM into `elLegendWrap`.
   * Caller is responsible for clearing the wrap first.
   */
  draw() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    if (!elLegendWrap) return;
    const cfg = this._cfg();
    const position = w.config.legend.position;
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
    const gradId = `apexcharts-heatmap-gradient-${w.globals.cuid}`;
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
    stops.forEach((s2) => {
      const stopEl = BrowserAPIs.createElementNS(SVG_NS, "stop");
      stopEl.setAttribute("offset", `${(s2.percent * 100).toFixed(2)}%`);
      stopEl.setAttribute("stop-color", s2.color);
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
      const labelColor = ((_c = cfg.labelStyle) == null ? void 0 : _c.colors) || (Array.isArray(w.config.legend.labels.colors) ? w.config.legend.labels.colors[0] : w.config.legend.labels.colors) || w.config.chart.foreColor;
      const labelFontSize = ((_d = cfg.labelStyle) == null ? void 0 : _d.fontSize) || "11px";
      const labelFontFamily = ((_e = cfg.labelStyle) == null ? void 0 : _e.fontFamily) || w.config.chart.fontFamily;
      const fmt = this._getFormatter();
      const makeLabel = (text, x, y, anchor) => {
        const t2 = BrowserAPIs.createElementNS(SVG_NS, "text");
        t2.setAttribute("x", String(x));
        t2.setAttribute("y", String(y));
        t2.setAttribute("text-anchor", anchor);
        t2.setAttribute("dominant-baseline", "middle");
        t2.setAttribute("fill", labelColor);
        t2.setAttribute("font-size", labelFontSize);
        if (labelFontFamily) t2.setAttribute("font-family", labelFontFamily);
        t2.textContent = String(text);
        return t2;
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
    const arrowColor = ((_f = cfg.arrow) == null ? void 0 : _f.color) || w.config.chart.foreColor;
    const arrow = this._buildArrow(arrowSize, arrowColor, position);
    svg.appendChild(arrow);
    this.arrowEl = arrow;
    this._bandHitEls = [];
    if (w.config.legend.onItemHover.highlightDataSeries && bands.length > 0) {
      bands.forEach((b) => {
        const hit = BrowserAPIs.createElementNS(SVG_NS, "rect");
        if (isVertical) {
          const yTop = stripY + stripLength - b.p2 * stripLength;
          const yBot = stripY + stripLength - b.p1 * stripLength;
          hit.setAttribute("x", String(stripX));
          hit.setAttribute("y", String(yTop));
          hit.setAttribute("width", String(stripThickness));
          hit.setAttribute("height", String(Math.max(0, yBot - yTop)));
        } else {
          hit.setAttribute("x", String(stripX + b.p1 * stripLength));
          hit.setAttribute("y", String(stripY));
          hit.setAttribute(
            "width",
            String(Math.max(0, (b.p2 - b.p1) * stripLength))
          );
          hit.setAttribute("height", String(stripThickness));
        }
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("class", "apexcharts-heatmap-gradient-band");
        hit.setAttribute("data:range-index", String(b.index));
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
      tt.style.fontFamily = ((_h = cfg.labelStyle) == null ? void 0 : _h.fontFamily) || w.config.chart.fontFamily || "";
      tt.style.color = w.config.chart.foreColor;
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
    this._applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight);
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
    const w = this.w;
    const basis = isVertical ? w.globals.svgHeight || w.config.chart.height || 300 : w.globals.svgWidth || w.config.chart.width || 600;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.endsWith("%")) {
        const pct = parseFloat(trimmed) || 0;
        return Math.max(20, basis * pct / 100);
      }
      const n2 = parseFloat(trimmed);
      return Number.isFinite(n2) ? n2 : 200;
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
    const w = this.w;
    const cfg = this._cfg();
    const align = cfg.align || "center";
    const edgePad = 12;
    const chartWidth = w.globals.svgWidth || w.config.chart.width || 600;
    const chartHeight = w.globals.svgHeight || w.config.chart.height || 300;
    const userOffsetX = w.config.legend.offsetX || 0;
    const userOffsetY = w.config.legend.offsetY || 0;
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
    const w = this.w;
    const g = w.globals;
    const wrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    if (!wrap || !this._geom) return;
    if (!Number.isFinite(g.gridWidth) || !Number.isFinite(g.gridHeight)) return;
    const { isVertical, position, svgWidth, svgHeight, stripX, stripY, stripThickness } = this._geom;
    const align = this._cfg().align || "center";
    const ox = w.config.legend.offsetX || 0;
    const oy = w.config.legend.offsetY || 0;
    const dimHelpers = (_b = (_a = this.ctx) == null ? void 0 : _a.dimensions) == null ? void 0 : _b.dimHelpers;
    const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
    const xAxisArea = w.layout.xAxisHeight || 0;
    const alongOffset = (extent, size) => {
      const avail = Math.max(0, extent - size);
      if (align === "start") return 0;
      if (align === "end") return avail;
      return avail / 2;
    };
    if (isVertical) {
      wrap.style.top = g.translateY + alongOffset(g.gridHeight, svgHeight) + oy + "px";
      const bandStart = position === "left" ? 0 : g.translateX + g.gridWidth;
      const bandEnd = position === "left" ? g.translateX : g.svgWidth;
      const stripCenter = (bandStart + bandEnd) / 2;
      wrap.style.left = stripCenter - stripX - stripThickness / 2 + ox + "px";
    } else {
      wrap.style.left = g.translateX + alongOffset(g.gridWidth, svgWidth) + ox + "px";
      const bandStart = position === "top" ? titleArea : g.translateY + g.gridHeight + xAxisArea;
      const bandEnd = position === "top" ? g.translateY : g.svgHeight;
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
    const w = this.w;
    const wrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    const strip = this.svgEl && this.svgEl.querySelector("rect");
    const grid = w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!wrap || !strip || !grid || !this._geom) return;
    const s2 = strip.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    if (!s2.width || !s2.height || !gr.width || !gr.height) return;
    const MIN_GAP = 16;
    const { isVertical, position } = this._geom;
    if (isVertical) {
      const gap = position === "left" ? gr.left - s2.right : s2.left - gr.right;
      if (gap < MIN_GAP) {
        const curLeft = parseFloat(wrap.style.left) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.left = curLeft + (position === "left" ? -shift : shift) + "px";
      }
    } else {
      const gap = position === "top" ? gr.top - s2.bottom : s2.top - gr.bottom;
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
    for (let i2 = 0; i2 < this._bandHitEls.length; i2++) {
      const el = this._bandHitEls[i2];
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
    for (let i2 = 0; i2 < this._bandHitEls.length; i2++) {
      const el = this._bandHitEls[i2];
      el.addEventListener("mousemove", this._onBandEnter);
      el.addEventListener("mouseout", this._onBandLeave);
    }
  }
  /**
   * Hovering a gradient band highlights its cells and dims the rest. Guarded
   * so the repeated mousemove stream only re-applies on an actual band change.
   * @param {Event} e
   */
  _onBandEnter(e2) {
    var _a, _b, _c, _d;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e2.currentTarget
    );
    const idx = parseInt((_a = target.getAttribute("data:range-index")) != null ? _a : "-1", 10);
    if (idx < 0 || idx === this._activeBandIndex) return;
    this._activeBandIndex = idx;
    (_d = (_c = (_b = this.ctx) == null ? void 0 : _b.events) == null ? void 0 : _c.fireEvent) == null ? void 0 : _d.call(_c, "legendHover", [this.ctx, idx, w]);
    new Series(w).highlightRangeInSeries(idx, "highlight");
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
    const w = this.w;
    if (!this.arrowEl) return;
    const opts = args[args.length - 1];
    if (!opts || typeof opts !== "object") return;
    const i2 = opts.seriesIndex;
    const j = opts.dataPointIndex;
    if (typeof i2 !== "number" || typeof j !== "number") return;
    if (!HeatmapGradientLegend.supports(w)) return;
    let val;
    if (this._continuous) {
      val = colorValueOf(w, i2, j);
    } else {
      val = (_c = (_b = (_a = w.seriesData) == null ? void 0 : _a.series) == null ? void 0 : _b[i2]) == null ? void 0 : _c[j];
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
    const w = this.w;
    const cs = HeatmapGradientLegend.colorScaleOf(w) || {};
    const cfg = this._cfg();
    const continuous = buildContinuousScale(w);
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
    const rows = ((_a = w.seriesData) == null ? void 0 : _a.series) || [];
    for (let i2 = 0; i2 < rows.length; i2++) {
      const row = rows[i2];
      if (!row) continue;
      for (let j = 0; j < row.length; j++) {
        const v = row[j];
        if (v == null || Number.isNaN(v)) continue;
        if (v < dataMin) dataMin = v;
        if (v > dataMax) dataMax = v;
      }
    }
    if (!Number.isFinite(dataMin)) dataMin = 0;
    if (!Number.isFinite(dataMax)) dataMax = 0;
    let min = dataMin;
    let max = dataMax;
    if (typeof cs.min !== "undefined") {
      min = cs.min < dataMin ? cs.min : dataMin;
    }
    if (typeof cs.max !== "undefined") {
      max = cs.max > dataMax ? cs.max : dataMax;
    }
    const stops = [];
    const bands = [];
    if (cs.ranges && cs.ranges.length > 0) {
      const ranges = cs.ranges.map((r2, originalIndex) => __spreadProps(__spreadValues({}, r2), {
        _originalIndex: originalIndex
      })).sort((a2, b) => a2.from - b.from);
      const lo = ranges[0].from;
      const hi = ranges[ranges.length - 1].to;
      min = lo;
      max = hi;
      const span = hi - lo || 1;
      ranges.forEach((r2) => {
        const p1 = (r2.from - lo) / span;
        const p2 = (r2.to - lo) / span;
        stops.push({ percent: (p1 + p2) / 2, color: r2.color });
        bands.push({ index: r2._originalIndex, p1, p2 });
      });
    } else {
      const baseColor = w.globals.colors[0] || "#008FFB";
      const utils = new Utils();
      const plot = w.config.plotOptions[w.config.chart.type] || {};
      const shadeIntensity = (_b = plot.shadeIntensity) != null ? _b : 0.5;
      const hasNegs = (
        /** @type {any} */
        w.globals.hasNegs
      );
      const n2 = Math.max(2, cfg.stops || 16);
      for (let s2 = 0; s2 < n2; s2++) {
        const t2 = s2 / (n2 - 1);
        const v = min + t2 * (max - min);
        const total = Math.abs(max) + Math.abs(min);
        const percent_v = total === 0 ? 0 : 100 * v / total;
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
          w.config.theme.mode === "dark" ? colorShadePercent * -1 : colorShadePercent,
          baseColor
        ) : baseColor;
        stops.push({ percent: t2, color: shaded });
      }
    }
    return { min, max, stops, bands };
  }
}
const Markers = ApexCharts.__apex_Markers;
class Legend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.updateSeries = (...a2) => ctx.updateHelpers._updateSeries(...a2);
    this.onLegendClick = this.onLegendClick.bind(this);
    this.onLegendHovered = this.onLegendHovered.bind(this);
    this.isBarsDistributed = this.w.config.chart.type === "bar" && this.w.config.plotOptions.bar.distributed && this.w.config.series.length === 1;
    this.legendHelpers = new Helpers$1(this);
  }
  init() {
    const w = this.w;
    const gl = w.globals;
    const cnf = w.config;
    this.isBarsDistributed = cnf.chart.type === "bar" && cnf.plotOptions.bar.distributed && cnf.series.length === 1;
    const showLegendAlways = cnf.legend.showForSingleSeries && this.w.seriesData.series.length === 1 || this.isBarsDistributed || // Heatmap legends are colorScale-driven (discrete ranges or the
    // gradient strip), not series-driven, so they must render even for a
    // single-row heatmap.
    cnf.chart.type === "heatmap" || // Same for a treemap once it has a gradient strip: a nested treemap is
    // usually one series, and the strip describes the colour metric rather
    // than the series.
    HeatmapGradientLegend.isEnabled(w) || this.w.seriesData.series.length > 1;
    this.legendHelpers.appendToForeignObject();
    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      const elLegendWrap = (
        /** @type {HTMLElement} */
        w.dom.elLegendWrap
      );
      while (elLegendWrap.firstChild) {
        elLegendWrap.removeChild(elLegendWrap.firstChild);
      }
      if (this.heatmapGradientLegend) {
        this.heatmapGradientLegend.destroy();
        this.heatmapGradientLegend = null;
      }
      if (HeatmapGradientLegend.isEnabled(w)) {
        this.heatmapGradientLegend = new HeatmapGradientLegend(w, this.ctx);
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
  createLegendMarker({ i: i2, fillcolor }) {
    const w = this.w;
    const elMarker = BrowserAPIs.createElement("span");
    elMarker.classList.add("apexcharts-legend-marker");
    const mShape = w.config.legend.markers.shape || w.config.markers.shape;
    let shape = mShape;
    if (Array.isArray(mShape)) {
      shape = mShape[i2];
    }
    const mSize = Array.isArray(w.config.legend.markers.size) ? parseFloat(w.config.legend.markers.size[i2]) : parseFloat(w.config.legend.markers.size);
    const mOffsetX = Array.isArray(w.config.legend.markers.offsetX) ? parseFloat(w.config.legend.markers.offsetX[i2]) : parseFloat(w.config.legend.markers.offsetX);
    const mOffsetY = Array.isArray(w.config.legend.markers.offsetY) ? parseFloat(w.config.legend.markers.offsetY[i2]) : parseFloat(w.config.legend.markers.offsetY);
    const mBorderWidth = Array.isArray(w.config.legend.markers.strokeWidth) ? parseFloat(w.config.legend.markers.strokeWidth[i2]) : parseFloat(w.config.legend.markers.strokeWidth);
    const mStyle = elMarker.style;
    mStyle.height = (mSize + mBorderWidth) * 2 + "px";
    mStyle.width = (mSize + mBorderWidth) * 2 + "px";
    mStyle.left = mOffsetX + "px";
    mStyle.top = mOffsetY + "px";
    if (w.config.legend.markers.customHTML) {
      mStyle.background = "transparent";
      mStyle.color = fillcolor[i2];
      if (Array.isArray(w.config.legend.markers.customHTML)) {
        if (w.config.legend.markers.customHTML[i2]) {
          elMarker.innerHTML = w.config.legend.markers.customHTML[i2]();
        }
      } else {
        elMarker.innerHTML = w.config.legend.markers.customHTML();
      }
    } else {
      const markers = new Markers(this.ctx.w, this.ctx);
      const markerConfig = markers.getMarkerConfig({
        cssClass: `apexcharts-legend-marker apexcharts-marker apexcharts-marker-${shape}`,
        seriesIndex: i2,
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
        pointFillColor: Array.isArray(fillcolor) ? fillcolor[i2] : markerConfig.pointFillColor,
        shape
      }));
      const shapesEls = w.dom.Paper.find(
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
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    const fontFamily = w.config.legend.fontFamily;
    let legendNames = w.seriesData.seriesNames;
    let fillcolor = w.config.legend.markers.fillColors ? w.config.legend.markers.fillColors.slice() : w.globals.colors.slice();
    if (w.config.chart.type === "heatmap") {
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges;
      legendNames = ranges.map((colorScale) => {
        return colorScale.name ? colorScale.name : colorScale.from + " - " + colorScale.to;
      });
      fillcolor = ranges.map((color) => color.color);
    } else if (this.isBarsDistributed) {
      legendNames = w.labelData.labels.slice();
    }
    if (w.config.legend.customLegendItems.length) {
      legendNames = w.config.legend.customLegendItems;
    }
    const legendFormatter = w.formatters.legendFormatter;
    const isLegendInversed = w.config.legend.inverseOrder;
    const legendGroups = [];
    if (w.labelData.seriesGroups.length > 1 && w.config.legend.clusterGroupedSeries) {
      w.labelData.seriesGroups.forEach((_, gi) => {
        legendGroups[gi] = BrowserAPIs.createElement("div");
        legendGroups[gi].classList.add(
          "apexcharts-legend-group",
          `apexcharts-legend-group-${gi}`
        );
        if (w.config.legend.clusterGroupedSeriesOrientation === "horizontal") {
          elLegendWrap.classList.add("apexcharts-legend-group-horizontal");
        } else {
          legendGroups[gi].classList.add("apexcharts-legend-group-vertical");
        }
      });
    }
    for (let i2 = isLegendInversed ? legendNames.length - 1 : 0; isLegendInversed ? i2 >= 0 : i2 <= legendNames.length - 1; isLegendInversed ? i2-- : i2++) {
      const text = legendFormatter(legendNames[i2], { seriesIndex: i2, w });
      let collapsedSeries = false;
      let ancillaryCollapsedSeries = false;
      if (w.globals.collapsedSeries.length > 0) {
        for (let c2 = 0; c2 < w.globals.collapsedSeries.length; c2++) {
          if (w.globals.collapsedSeries[c2].index === i2) {
            collapsedSeries = true;
          }
        }
      }
      if (w.globals.ancillaryCollapsedSeriesIndices.length > 0) {
        for (let c2 = 0; c2 < w.globals.ancillaryCollapsedSeriesIndices.length; c2++) {
          if (w.globals.ancillaryCollapsedSeriesIndices[c2] === i2) {
            ancillaryCollapsedSeries = true;
          }
        }
      }
      const elMarker = this.createLegendMarker({ i: i2, fillcolor });
      Graphics.setAttrs(elMarker, {
        rel: i2 + 1,
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elMarker.classList.add("apexcharts-inactive-legend");
      }
      const elLegend = BrowserAPIs.createElement("div");
      if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.keyboard.enabled) {
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
      let textColor = w.config.legend.labels.useSeriesColors ? w.globals.colors[i2] : Array.isArray(w.config.legend.labels.colors) ? (_a = w.config.legend.labels.colors) == null ? void 0 : _a[i2] : w.config.legend.labels.colors;
      if (!textColor) {
        textColor = w.config.chart.foreColor;
      }
      elLegendText.style.color = textColor;
      elLegendText.style.fontSize = w.config.legend.fontSize;
      elLegendText.style.fontWeight = w.config.legend.fontWeight;
      elLegendText.style.fontFamily = fontFamily || w.config.chart.fontFamily;
      Graphics.setAttrs(elLegendText, {
        rel: i2 + 1,
        i: i2,
        "data:default-text": encodeURIComponent(text),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      elLegend.appendChild(elMarker);
      elLegend.appendChild(elLegendText);
      const coreUtils = new CoreUtils(this.w);
      if (!w.config.legend.showForZeroSeries) {
        const total = coreUtils.getSeriesTotalByIndex(i2);
        if (total === 0 && coreUtils.seriesHaveSameValues(i2) && !coreUtils.isSeriesNull(i2) && w.globals.collapsedSeriesIndices.indexOf(i2) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(i2) === -1) {
          elLegend.classList.add("apexcharts-hidden-zero-series");
        }
      }
      if (!w.config.legend.showForNullSeries) {
        if (coreUtils.isSeriesNull(i2) && w.globals.collapsedSeriesIndices.indexOf(i2) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(i2) === -1) {
          elLegend.classList.add("apexcharts-hidden-null-series");
        }
      }
      if (legendGroups.length) {
        w.labelData.seriesGroups.forEach((group, gi) => {
          var _a2, _b;
          if (group.includes(
            /** @type {Record<string,any>} */
            (_b = (_a2 = w.config.series[i2]) == null ? void 0 : _a2.name) != null ? _b : ""
          )) {
            elLegendWrap.appendChild(legendGroups[gi]);
            legendGroups[gi].appendChild(elLegend);
          }
        });
      } else {
        elLegendWrap.appendChild(elLegend);
      }
      elLegendWrap.classList.add(
        `apexcharts-align-${w.config.legend.horizontalAlign}`
      );
      elLegendWrap.classList.add(
        "apx-legend-position-" + w.config.legend.position
      );
      elLegend.classList.add("apexcharts-legend-series");
      elLegend.style.margin = `${w.config.legend.itemMargin.vertical}px ${w.config.legend.itemMargin.horizontal}px`;
      elLegendWrap.style.width = w.config.legend.width ? w.config.legend.width + "px" : "";
      elLegendWrap.style.height = w.config.legend.height ? w.config.legend.height + "px" : "";
      Graphics.setAttrs(elLegend, {
        rel: i2 + 1,
        seriesName: Utils.escapeString(legendNames[i2]),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elLegend.classList.add("apexcharts-inactive-legend");
      }
      if (!w.config.legend.onItemClick.toggleDataSeries) {
        elLegend.classList.add("apexcharts-no-click");
      }
    }
    w.dom.elWrap.addEventListener("click", me.onLegendClick, true);
    if (w.config.legend.onItemHover.highlightDataSeries && w.config.legend.customLegendItems.length === 0) {
      w.dom.elWrap.addEventListener("mousemove", me.onLegendHovered, true);
      w.dom.elWrap.addEventListener("mouseout", me.onLegendHovered, true);
    }
    if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.keyboard.enabled) {
      w.dom.elWrap.addEventListener(
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
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    const legendHeight = elLegendWrap.clientHeight;
    let x = 0;
    let y = 0;
    if (w.config.legend.position === "bottom") {
      y = w.globals.svgHeight - Math.min(legendHeight, w.globals.svgHeight / 2) - 5;
    } else if (w.config.legend.position === "top") {
      const dim = new Dimensions(this.w, this.ctx);
      const titleH = dim.dimHelpers.getTitleSubtitleCoords("title").height;
      const subtitleH = dim.dimHelpers.getTitleSubtitleCoords("subtitle").height;
      y = (titleH > 0 ? titleH - 10 : 0) + (subtitleH > 0 ? subtitleH - 10 : 0);
    }
    elLegendWrap.style.position = "absolute";
    x = x + offsetX + w.config.legend.offsetX;
    y = y + offsetY + w.config.legend.offsetY;
    elLegendWrap.style.left = x + "px";
    elLegendWrap.style.top = y + "px";
    if (w.config.legend.position === "right") {
      elLegendWrap.style.left = "auto";
      elLegendWrap.style.right = 25 + w.config.legend.offsetX + "px";
    }
    const fixedHeigthWidth = (
      /** @type {const} */
      ["width", "height"]
    );
    fixedHeigthWidth.forEach((hw) => {
      if (elLegendWrap && elLegendWrap.style[hw]) {
        elLegendWrap.style[hw] = parseInt(String(w.config.legend[hw]), 10) + "px";
      }
    });
  }
  legendAlignHorizontal() {
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    elLegendWrap.style.right = "0";
    const dimensions = new Dimensions(this.w, this.ctx);
    const titleRect = dimensions.dimHelpers.getTitleSubtitleCoords("title");
    const subtitleRect = dimensions.dimHelpers.getTitleSubtitleCoords("subtitle");
    const offsetX = 20;
    let offsetY = 0;
    if (w.config.legend.position === "top") {
      offsetY = titleRect.height + subtitleRect.height + w.config.title.margin + w.config.subtitle.margin - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  legendAlignVertical() {
    const w = this.w;
    const lRect = this.legendHelpers.getLegendDimensions();
    const offsetY = 20;
    let offsetX = 0;
    if (w.config.legend.position === "left") {
      offsetX = 20;
    }
    if (w.config.legend.position === "right") {
      offsetX = w.globals.svgWidth - lRect.clww - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  /**
   * @param {MouseEvent} e
   */
  onLegendHovered(e2) {
    var _a;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e2.target
    );
    const hoverOverLegend = target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker");
    if (w.config.chart.type !== "heatmap" && !this.isBarsDistributed) {
      if (!target.classList.contains("apexcharts-inactive-legend") && hoverOverLegend) {
        const series = new Series(this.ctx.w);
        series.toggleSeriesOnHover(e2, target);
      }
    } else {
      if (hoverOverLegend) {
        const seriesCnt = parseInt((_a = target.getAttribute("rel")) != null ? _a : "0", 10) - 1;
        this.ctx.events.fireEvent("legendHover", [this.ctx, seriesCnt, this.w]);
        const series = new Series(this.ctx.w);
        if (e2.type === "mousemove") {
          series.highlightRangeInSeries(seriesCnt, "highlight");
        } else if (e2.type === "mouseout") {
          series.highlightRangeInSeries(seriesCnt, "reset");
        }
      }
    }
  }
  /**
   * @param {KeyboardEvent} e
   */
  onLegendKeyDown(e2) {
    const me = this;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e2.target
    );
    const isLegendItem = target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker");
    if (!isLegendItem) return;
    if (e2.key === "Enter" || e2.key === " ") {
      e2.preventDefault();
      const rel = target.getAttribute("rel");
      me.onLegendClick(e2);
      if (rel !== null && w.config.legend.onItemClick.toggleDataSeries) {
        requestAnimationFrame(() => {
          const restored = w.dom.baseEl.querySelector(
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
  onLegendClick(e2) {
    var _a;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e2.target
    );
    if (w.config.legend.customLegendItems.length) return;
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
      const clickAllowed = w.config.chart.type !== "treemap" && w.config.chart.type !== "heatmap" && !this.isBarsDistributed;
      if (clickAllowed && w.config.legend.onItemClick.toggleDataSeries) {
        this.legendHelpers.toggleDataSeries(seriesCnt, isHidden);
      }
    }
  }
}
ApexCharts__default.registerFeatures({ legend: Legend });
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
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.ev = this.w.config.chart.events;
    this.selectedClass = "apexcharts-selected";
    this.localeValues = this.w.globals.locale.toolbar;
    this.minX = w.globals.minX;
    this.maxX = w.globals.maxX;
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
    const w = this.w;
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
    elToolbarWrap.style.top = w.config.chart.toolbar.offsetY + "px";
    elToolbarWrap.style.right = -w.config.chart.toolbar.offsetX + 3 + "px";
    w.dom.elWrap.appendChild(elToolbarWrap);
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
    this.t = w.config.chart.toolbar.tools;
    if (Array.isArray(this.t.customIcons)) {
      for (let i2 = 0; i2 < this.t.customIcons.length; i2++) {
        this.elCustomIcons.push(createBtn());
      }
    }
    const toolbarControls = [];
    const appendZoomControl = (type, el, ico) => {
      const tool = type.toLowerCase();
      if (this.t[tool] && w.config.chart.zoom.enabled) {
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
      if (this.t[z] && w.config.chart[z].enabled) {
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
    if (this.t.pan && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elPan,
        icon: typeof this.t.pan === "string" ? this.t.pan : icoPan,
        title: this.localeValues.pan,
        class: "apexcharts-pan-icon"
      });
    }
    if (this.t.measure && w.config.chart.measure && w.config.chart.measure.enabled) {
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
    for (let i2 = 0; i2 < this.elCustomIcons.length; i2++) {
      toolbarControls.push({
        el: this.elCustomIcons[i2],
        icon: this.t.customIcons[i2].icon,
        title: this.t.customIcons[i2].title,
        index: this.t.customIcons[i2].index,
        class: "apexcharts-toolbar-custom-icon " + this.t.customIcons[i2].class
      });
    }
    toolbarControls.forEach((t2, index) => {
      if (t2.index) {
        Utils.moveIndexInArray(toolbarControls, index, t2.index);
      }
    });
    for (let i2 = 0; i2 < toolbarControls.length; i2++) {
      Graphics.setAttrs(toolbarControls[i2].el, {
        class: toolbarControls[i2].class,
        title: toolbarControls[i2].title,
        "aria-label": toolbarControls[i2].title
      });
      toolbarControls[i2].el.innerHTML = toolbarControls[i2].icon;
      elToolbarWrap.appendChild(toolbarControls[i2].el);
    }
    if (this.elZoom.parentNode) {
      this.elZoom.setAttribute("aria-pressed", String(!!w.interact.zoomEnabled));
    }
    if (this.elSelection.parentNode) {
      this.elSelection.setAttribute(
        "aria-pressed",
        String(!!w.interact.selectionEnabled)
      );
    }
    if (this.elPan.parentNode) {
      this.elPan.setAttribute("aria-pressed", String(!!w.interact.panEnabled));
    }
    if (this.elMeasure.parentNode) {
      this.elMeasure.setAttribute(
        "aria-pressed",
        String(!!w.interact.measureEnabled)
      );
    }
    if (this.elMenuIcon.parentNode) {
      this.elMenuIcon.setAttribute("aria-haspopup", "true");
      this.elMenuIcon.setAttribute("aria-expanded", "false");
    }
    this._createHamburgerMenu(elToolbarWrap);
    if (w.interact.zoomEnabled) {
      this.elZoom.classList.add(this.selectedClass);
    } else if (w.interact.panEnabled) {
      this.elPan.classList.add(this.selectedClass);
    } else if (w.interact.selectionEnabled) {
      this.elSelection.classList.add(this.selectedClass);
    } else if (w.interact.measureEnabled && this.elMeasure) {
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
    for (let i2 = 0; i2 < menuItems.length; i2++) {
      this.elMenuItems.push(
        BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "div")
      );
      this.elMenuItems[i2].innerHTML = menuItems[i2].title;
      Graphics.setAttrs(this.elMenuItems[i2], {
        class: `apexcharts-menu-item ${menuItems[i2].name}`,
        title: menuItems[i2].title,
        role: "menuitem",
        tabindex: "-1"
      });
      this.elMenu.appendChild(this.elMenuItems[i2]);
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
    this.elMenuItems.forEach((m) => {
      if (m.classList.contains("exportSVG")) {
        m.addEventListener("click", this.handleDownload.bind(this, "svg"));
      } else if (m.classList.contains("exportPNG")) {
        m.addEventListener("click", this.handleDownload.bind(this, "png"));
      } else if (m.classList.contains("exportCSV")) {
        m.addEventListener("click", this.handleDownload.bind(this, "csv"));
      }
    });
    for (let i2 = 0; i2 < this.t.customIcons.length; i2++) {
      this.elCustomIcons[i2].addEventListener(
        "click",
        this.t.customIcons[i2].click.bind(this, this.ctx, this.ctx.w)
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
      btn.addEventListener("keydown", (e2) => {
        if (e2.key === "Enter" || e2.key === " ") {
          e2.preventDefault();
          const btnClass = btn.className;
          btn.click();
          requestAnimationFrame(() => {
            const baseEl = this.w.dom.baseEl;
            if (!baseEl) return;
            const apexClass = btnClass.split(" ").find((c2) => c2.startsWith("apexcharts-"));
            if (!apexClass) return;
            const restored = baseEl.querySelector(`.${apexClass}`);
            if (restored) restored.focus();
          });
        }
      });
    });
    (_i = this.elMenuIcon) == null ? void 0 : _i.addEventListener(
      "keydown",
      (e2) => {
        var _a2;
        if (e2.key === "ArrowDown" || e2.key === "ArrowUp") {
          e2.preventDefault();
          if (!((_a2 = this.elMenu) == null ? void 0 : _a2.classList.contains("apexcharts-menu-open"))) {
            this.toggleMenu();
          }
          window.setTimeout(() => {
            const idx = e2.key === "ArrowDown" ? 0 : this.elMenuItems.length - 1;
            if (this.elMenuItems[idx])
              this.elMenuItems[idx].focus();
          }, 20);
        }
      }
    );
    this.elMenuItems.forEach((m, idx) => {
      m.addEventListener("keydown", (e2) => {
        var _a2;
        if (e2.key === "ArrowDown") {
          e2.preventDefault();
          const next = this.elMenuItems[idx + 1] || this.elMenuItems[0];
          next.focus();
        } else if (e2.key === "ArrowUp") {
          e2.preventDefault();
          const prev = this.elMenuItems[idx - 1] || this.elMenuItems[this.elMenuItems.length - 1];
          prev.focus();
        } else if (e2.key === "Escape" || e2.key === "Tab") {
          this._closeMenu();
          (_a2 = this.elMenuIcon) == null ? void 0 : _a2.focus();
          if (e2.key === "Tab") ;
          else {
            e2.preventDefault();
          }
        } else if (e2.key === "Enter" || e2.key === " ") {
          e2.preventDefault();
          m.click();
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
    const w = this.w;
    const enabling = !w.interact.measureEnabled;
    this.toggleOtherControls();
    if (enabling) {
      w.interact.measureEnabled = true;
      (_a = this.elMeasure) == null ? void 0 : _a.classList.add(this.selectedClass);
      (_c = (_b = this.ctx.measure) == null ? void 0 : _b.startMeasure) == null ? void 0 : _c.call(_b);
    }
    (_d = this.elMeasure) == null ? void 0 : _d.setAttribute(
      "aria-pressed",
      String(w.interact.measureEnabled)
    );
  }
  getToolbarIconsReference() {
    const w = this.w;
    if (!this.elZoom) {
      this.elZoom = w.dom.baseEl.querySelector(".apexcharts-zoom-icon");
    }
    if (!this.elPan) {
      this.elPan = w.dom.baseEl.querySelector(".apexcharts-pan-icon");
    }
    if (!this.elSelection) {
      this.elSelection = w.dom.baseEl.querySelector(
        ".apexcharts-selection-icon"
      );
    }
    if (!this.elMeasure) {
      this.elMeasure = w.dom.baseEl.querySelector(".apexcharts-measure-icon");
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
    const w = this.w;
    w.interact.panEnabled = false;
    w.interact.zoomEnabled = false;
    w.interact.selectionEnabled = false;
    if (w.interact.measureEnabled) {
      w.interact.measureEnabled = false;
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
    const w = this.w;
    if (w.axisFlags.isRangeBar) {
      return { minX: w.globals.minY, maxX: w.globals.maxY };
    }
    return { minX: w.globals.minX, maxX: w.globals.maxX };
  }
  handleZoomIn() {
    const w = this.w;
    const { minX, maxX } = this._currentXRange();
    this.minX = minX;
    this.maxX = maxX;
    const centerX = (minX + maxX) / 2;
    const newMinX = (minX + centerX) / 2;
    const newMaxX = (maxX + centerX) / 2;
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w.interact.disableZoomIn) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  handleZoomOut() {
    const w = this.w;
    const { minX, maxX } = this._currentXRange();
    this.minX = minX;
    this.maxX = maxX;
    if (w.config.xaxis.type === "datetime" && new Date(minX).getUTCFullYear() < 1e3) {
      return;
    }
    const centerX = (minX + maxX) / 2;
    const newMinX = minX - (centerX - minX);
    const newMaxX = maxX - (centerX - maxX);
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w.interact.disableZoomOut) {
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
    const w = this.w;
    if (newMinX === void 0 && newMaxX === void 0) {
      this.handleZoomReset();
      return;
    }
    if (w.config.xaxis.convertedCatToNumeric) {
      if (newMinX < 1) {
        newMinX = 1;
        newMaxX = w.globals.dataPoints;
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
    if (!w.globals.initialConfig) return;
    const yaxis = Utils.clone(w.globals.initialConfig.yaxis);
    if (!w.config.chart.group) {
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
    const w = this.w;
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
          series: w.config.series,
          columnDelimiter: w.config.chart.toolbar.export.csv.columnDelimiter
        });
        break;
    }
  }
  handleZoomReset() {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      const w = ch.w;
      if (!w.interact.zoomed) return;
      w.globals.lastXAxis.min = w.globals.initialConfig.xaxis.min;
      w.globals.lastXAxis.max = w.globals.initialConfig.xaxis.max;
      ch.updateHelpers.revertDefaultAxisMinMax();
      if (typeof w.config.chart.events.beforeResetZoom === "function") {
        const resetZoomRange = w.config.chart.events.beforeResetZoom(ch, w);
        if (resetZoomRange) {
          ch.updateHelpers.revertDefaultAxisMinMax(resetZoomRange);
        }
      }
      if (typeof w.config.chart.events.zoomed === "function") {
        ch.ctx.toolbar.zoomCallback({
          min: w.config.xaxis.min,
          max: w.config.xaxis.max
        });
      }
      const series = ch.ctx.series.emptyCollapsedSeries(
        Utils.clone(w.globals.initialSeries)
      );
      ch.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
      w.interact.zoomed = false;
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
const Box = ApexCharts.__apex_index_Box;
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
  constructor(w, ctx) {
    super(w, ctx);
    this.w = w;
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
    const w = this.w;
    const me = this;
    this.xyRatios = xyRatios;
    this.zoomRect = this.graphics.drawRect(0, 0, 0, 0);
    this.selectionRect = this.graphics.drawRect(0, 0, 0, 0);
    this.constraints = new Box(0, 0, w.layout.gridWidth, w.layout.gridHeight);
    this.zoomRect.node.classList.add("apexcharts-zoom-rect");
    this.selectionRect.node.classList.add("apexcharts-selection-rect");
    w.dom.Paper.add(this.zoomRect);
    w.dom.Paper.add(this.selectionRect);
    if (w.config.chart.selection.type === "x") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        minY: 0,
        maxX: w.layout.gridWidth,
        maxY: w.layout.gridHeight
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else if (w.config.chart.selection.type === "y") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        maxX: w.layout.gridWidth
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else {
      this.slDraggableRect = this.selectionRect.draggable().on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    }
    this.preselectedSelection();
    this.hoverArea = /** @type {Element} */
    w.dom.baseEl.querySelector(`${w.globals.chartClass} .apexcharts-svg`);
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
  svgMouseEvents(xyRatios, e2) {
    const w = this.w;
    const toolbar = this.ctx.toolbar;
    if (w.interact.momentum && w.interact.momentum.busy) return;
    if (this._momentumEnabled() && e2.touches && e2.touches.length > 1) {
      return;
    }
    const zoomtype = w.interact.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
    const autoSelected = w.config.chart.toolbar.autoSelected;
    if (autoSelected !== "measure") {
      if (e2.shiftKey) {
        w.interact.shiftWasPressed = true;
        toolbar.enableZoomPanFromToolbar(autoSelected === "pan" ? "zoom" : "pan");
      } else {
        if (w.interact.shiftWasPressed) {
          toolbar.enableZoomPanFromToolbar(autoSelected);
          w.interact.shiftWasPressed = false;
        }
      }
    }
    if (!e2.target) return;
    const tc = e2.target.classList;
    let pc;
    if (e2.target.parentNode && e2.target.parentNode !== null) {
      pc = e2.target.parentNode.classList;
    }
    const falsePositives = tc.contains("apexcharts-legend-marker") || tc.contains("apexcharts-legend-text") || pc && pc.contains("apexcharts-toolbar");
    if (falsePositives) return;
    this.clientX = e2.type === "touchmove" || e2.type === "touchstart" ? e2.touches[0].clientX : e2.type === "touchend" ? e2.changedTouches[0].clientX : e2.clientX;
    this.clientY = e2.type === "touchmove" || e2.type === "touchstart" ? e2.touches[0].clientY : e2.type === "touchend" ? e2.changedTouches[0].clientY : e2.clientY;
    if (e2.type === "mousedown" && e2.which === 1 || e2.type === "touchstart") {
      const gridRectDim = this._gridRect();
      if (!gridRectDim) return;
      this.startX = this._screenXToPlotPx(this.clientX);
      this.startY = this.clientY - gridRectDim.top;
      this.dragged = false;
      this.w.interact.mousedown = true;
    }
    if (e2.type === "mousemove" && e2.which === 1 || e2.type === "touchmove") {
      this.dragged = true;
      if (w.interact.panEnabled) {
        w.interact.selection = null;
        if (this.w.interact.mousedown) {
          this.panDragging({
            context: this,
            zoomtype,
            xyRatios: this.xyRatios
          });
        }
      } else {
        if (this.w.interact.mousedown && w.interact.zoomEnabled || this.w.interact.mousedown && w.interact.selectionEnabled) {
          this.selection = this.selectionDrawing({
            context: this,
            zoomtype
          });
        }
      }
    }
    if (e2.type === "mouseup" || e2.type === "touchend" || e2.type === "mouseleave") {
      this.handleMouseUp({ zoomtype });
    }
    this.makeSelectionRectDraggable();
  }
  /** @param {{ zoomtype?: any, isResized?: any }} opts */
  handleMouseUp({ zoomtype, isResized }) {
    const w = this.w;
    const gridRectDim = this._gridRect();
    if (gridRectDim && (this.w.interact.mousedown || isResized)) {
      this.endX = this._screenXToPlotPx(this.clientX);
      this.endY = this.clientY - gridRectDim.top;
      this.dragX = Math.abs(this.endX - this.startX);
      this.dragY = Math.abs(this.endY - this.startY);
      if (w.interact.zoomEnabled || w.interact.selectionEnabled) {
        this.selectionDrawn({
          context: this,
          zoomtype
        });
      }
    }
    if (w.interact.zoomEnabled) {
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
    const c2 = this.w.config.chart;
    if (!c2.zoom || !c2.zoom.enabled) return false;
    if (setting !== "auto") return !!setting;
    return !!(((_a = c2.toolbar) == null ? void 0 : _a.show) && ((_c = (_b = c2.toolbar) == null ? void 0 : _b.tools) == null ? void 0 : _c.reset));
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
  mouseWheelEvent(e2) {
    e2.preventDefault();
    const st = this._wheel();
    let dy = e2.deltaY;
    if (e2.deltaMode === 1) dy *= 33;
    else if (e2.deltaMode === 2) dy *= 330;
    st.factor *= Math.pow(2, dy / WHEEL_ZOOM_PIXELS_PER_2X);
    st.clientX = e2.clientX;
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
    const w = this.w;
    const st = this._wheel();
    st.rafId = null;
    const scale = st.factor;
    st.factor = 1;
    if (scale === 1 || w.globals.isDestroyed) return;
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
      const minXDiff = w.globals.minXDiff > 0 && isFinite(w.globals.minXDiff) ? w.globals.minXDiff : 0;
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
    const w = this.w;
    const st = this._wheel();
    st.endTimer = null;
    if (w.globals.isDestroyed || !w.interact.zoomed) return;
    const { min, max } = this._currentXWindow();
    const yaxis = w.globals.initialConfig ? Utils.clone(w.globals.initialConfig.yaxis) : [];
    const toolbar = this.ctx.toolbar;
    if (toolbar) toolbar.zoomCallback({ min, max }, yaxis);
  }
  makeSelectionRectDraggable() {
    const w = this.w;
    if (!this.selectionRect) return;
    const rectDim = this.selectionRect.node.getBoundingClientRect();
    if (rectDim.width > 0 && rectDim.height > 0) {
      this.selectionRect.select(false).resize(false);
      this.selectionRect.select({
        createRot: () => {
        },
        updateRot: () => {
        },
        createHandle: (group, p, index, pointArr, handleName) => {
          if (handleName === "l" || handleName === "r")
            return group.circle(8).css({ "stroke-width": 1, stroke: "#333", fill: "#fff" });
          return group.circle(0);
        },
        updateHandle: (group, p) => {
          return group.center(p[0], p[1]);
        }
      }).resize().on("resize", () => {
        var _a;
        if (w.interact.selectionEnabled) {
          w.interact.selection = {
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
          const zoomtype = w.interact.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
          this.handleMouseUp({ zoomtype, isResized: true });
        }
      });
    }
  }
  preselectedSelection() {
    const w = this.w;
    const xyRatios = this.xyRatios;
    if (!w.interact.zoomEnabled) {
      if (typeof w.interact.selection !== "undefined" && w.interact.selection !== null) {
        this.drawSelectionRect(__spreadProps(__spreadValues({}, w.interact.selection), {
          translateX: w.layout.translateX,
          translateY: w.layout.translateY
        }));
      } else {
        if (w.config.chart.selection.xaxis.min !== void 0 && w.config.chart.selection.xaxis.max !== void 0) {
          let x = AxisMapping.dataXToPx(w, w.config.chart.selection.xaxis.min);
          let width = AxisMapping.dataXToPx(w, w.config.chart.selection.xaxis.max) - x;
          if (w.axisFlags.isRangeBar) {
            x = (w.config.chart.selection.xaxis.min - w.globals.yAxisScale[0].niceMin) / xyRatios.invertedYRatio;
            width = (w.config.chart.selection.xaxis.max - w.config.chart.selection.xaxis.min) / xyRatios.invertedYRatio;
          }
          const selectionRect = {
            x,
            y: 0,
            width,
            height: w.layout.gridHeight,
            translateX: w.layout.translateX,
            translateY: w.layout.translateY,
            selectionEnabled: true
          };
          this.drawSelectionRect(selectionRect);
          this.makeSelectionRectDraggable();
          if (typeof w.config.chart.events.selection === "function") {
            w.config.chart.events.selection(this.ctx, {
              xaxis: {
                min: w.config.chart.selection.xaxis.min,
                max: w.config.chart.selection.xaxis.max
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
    const w = this.w;
    const zoomRect = this.zoomRect;
    const selectionRect = this.selectionRect;
    if (this.dragged || w.interact.selection !== null) {
      const scalingAttrs = {
        transform: "translate(" + translateX + ", " + translateY + ")"
      };
      if (w.interact.zoomEnabled && this.dragged) {
        if (width < 0) width = 1;
        zoomRect.attr({
          x,
          y,
          width,
          height,
          fill: w.config.chart.zoom.zoomedArea.fill.color,
          "fill-opacity": w.config.chart.zoom.zoomedArea.fill.opacity,
          stroke: w.config.chart.zoom.zoomedArea.stroke.color,
          "stroke-width": w.config.chart.zoom.zoomedArea.stroke.width,
          "stroke-opacity": w.config.chart.zoom.zoomedArea.stroke.opacity
        });
        Graphics.setAttrs(zoomRect.node, scalingAttrs);
      }
      if (w.interact.selectionEnabled) {
        selectionRect.attr({
          x,
          y,
          width: width > 0 ? width : 0,
          height: height > 0 ? height : 0,
          fill: w.config.chart.selection.fill.color,
          "fill-opacity": w.config.chart.selection.fill.opacity,
          stroke: w.config.chart.selection.stroke.color,
          "stroke-width": w.config.chart.selection.stroke.width,
          "stroke-dasharray": w.config.chart.selection.stroke.dashArray,
          "stroke-opacity": w.config.chart.selection.stroke.opacity
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
    const w = this.w;
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
      translateX: w.layout.translateX,
      translateY: w.layout.translateY
    };
    if (Math.abs(selectionWidth + startX) > w.layout.gridWidth) {
      selectionWidth = w.layout.gridWidth - startX;
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
        height: w.layout.gridHeight
      };
    } else if (zoomtype === "y") {
      selectionRect = {
        x: 0,
        y: inversedY ? startY - selectionHeight : startY,
        width: w.layout.gridWidth,
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
      translateX: w.layout.translateX,
      translateY: w.layout.translateY
    });
    me.drawSelectionRect(selectionRect);
    me.selectionDragging("resizing");
    return selectionRect;
  }
  /**
   * @param {string} type
   * @param {CustomEvent} e
   */
  selectionDragging(type, e2) {
    var _a;
    const w = this.w;
    if (!e2) return;
    e2.preventDefault();
    const { handler, box } = e2.detail;
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
    w.interact.selection = draggedProps;
    const link = w.config.chart.link;
    const linkActive = !!(link && (link.enabled || typeof link.dimension === "function"));
    if ((typeof w.config.chart.events.selection === "function" || linkActive) && w.interact.selectionEnabled) {
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
    const w = this.w;
    if (!w.interact.selectionEnabled) return;
    const link = w.config.chart.link;
    const linkActive = !!(link && (link.enabled || typeof link.dimension === "function"));
    if (typeof w.config.chart.events.selection !== "function" && !linkActive) {
      return;
    }
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const selectionRect = this.selectionRect.node.getBoundingClientRect();
    const xyRatios = this.xyRatios;
    let minX, maxX, minY, maxY;
    const relLeft = this._screenXToPlotPx(selectionRect.left);
    const relRight = this._screenXToPlotPx(selectionRect.right);
    if (!w.axisFlags.isRangeBar) {
      if (!w.globals.xAxisScale) return;
      minX = AxisMapping.pxToDataX(w, relLeft);
      maxX = AxisMapping.pxToDataX(w, relRight);
      minY = w.globals.yAxisScale[0].niceMin + (gridRectDim.bottom - selectionRect.bottom) * xyRatios.yRatio[0];
      maxY = w.globals.yAxisScale[0].niceMax - (selectionRect.top - gridRectDim.top) * xyRatios.yRatio[0];
    } else {
      minX = w.globals.yAxisScale[0].niceMin + relLeft * xyRatios.invertedYRatio;
      maxX = w.globals.yAxisScale[0].niceMin + relRight * xyRatios.invertedYRatio;
      minY = 0;
      maxY = 1;
    }
    const xyAxis = {
      xaxis: { min: minX, max: maxX },
      yaxis: { min: minY, max: maxY }
    };
    if (typeof w.config.chart.events.selection === "function") {
      w.config.chart.events.selection(this.ctx, xyAxis);
    }
    if (w.config.chart.brush.enabled && w.config.chart.events.brushScrolled !== void 0) {
      w.config.chart.events.brushScrolled(this.ctx, xyAxis);
    }
    (_a = this.ctx.linkedViews) == null ? void 0 : _a.onSourceSelection(xyAxis.xaxis);
  }
  /** @param {{context: any, zoomtype: any}} opts */
  selectionDrawn({ context, zoomtype }) {
    var _a;
    const w = this.w;
    const me = context;
    const xyRatios = this.xyRatios;
    const toolbar = this.ctx.toolbar;
    const selRect = w.interact.zoomEnabled ? me.zoomRect.node.getBoundingClientRect() : me.selectionRect.node.getBoundingClientRect();
    const gridRectDim = me._gridRect();
    if (!gridRectDim) return;
    const localStartX = this._screenXToPlotPx(selRect.left);
    const localEndX = this._screenXToPlotPx(selRect.right);
    const localStartY = selRect.top - gridRectDim.top;
    const localEndY = selRect.bottom - gridRectDim.top;
    let xLowestValue, xHighestValue;
    if (!w.axisFlags.isRangeBar) {
      xLowestValue = AxisMapping.pxToDataX(w, localStartX);
      xHighestValue = AxisMapping.pxToDataX(w, localEndX);
    } else {
      xLowestValue = w.globals.yAxisScale[0].niceMin + localStartX * xyRatios.invertedYRatio;
      xHighestValue = w.globals.yAxisScale[0].niceMin + localEndX * xyRatios.invertedYRatio;
    }
    const yHighestValue = [];
    const yLowestValue = [];
    w.config.yaxis.forEach((yaxe, index) => {
      const seriesIndex = w.globals.seriesYAxisMap[index][0];
      const highestVal = w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localStartY;
      const lowestVal = w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localEndY;
      yHighestValue.push(highestVal);
      yLowestValue.push(lowestVal);
    });
    if (me.dragged && (me.dragX > 10 || me.dragY > 10) && xLowestValue !== xHighestValue) {
      if (w.interact.zoomEnabled) {
        if (!w.globals.initialConfig) return;
        let yaxis = Utils.clone(w.globals.initialConfig.yaxis);
        let xaxis = Utils.clone(w.globals.initialConfig.xaxis);
        w.interact.zoomed = true;
        if (w.config.xaxis.convertedCatToNumeric) {
          xLowestValue = Math.floor(xLowestValue);
          xHighestValue = Math.floor(xHighestValue);
          if (xLowestValue < 1) {
            xLowestValue = 1;
            xHighestValue = w.globals.dataPoints;
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
        if (!w.config.chart.group) {
          options.yaxis = yaxis;
        }
        me.ctx.updateHelpers._updateOptions(
          options,
          false,
          me.w.config.chart.animations.dynamicAnimation.enabled
        );
        if (typeof w.config.chart.events.zoomed === "function") {
          toolbar.zoomCallback(xaxis, yaxis);
        }
      } else if (w.interact.selectionEnabled) {
        let yaxis = null;
        let xaxis = null;
        xaxis = {
          min: xLowestValue,
          max: xHighestValue
        };
        if (zoomtype === "xy" || zoomtype === "y") {
          const yaxisCopy = (
            /** @type {ApexYAxis[]} */
            Utils.clone(w.config.yaxis)
          );
          yaxis = yaxisCopy;
          yaxisCopy.forEach((yaxe, index) => {
            yaxisCopy[index].min = yLowestValue[index];
            yaxisCopy[index].max = yHighestValue[index];
          });
        }
        w.interact.selection = me.selection;
        if (typeof w.config.chart.events.selection === "function") {
          w.config.chart.events.selection(me.ctx, {
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
    const w = this.w;
    const me = context;
    if (typeof w.interact.lastClientPosition.x !== "undefined") {
      const deltaX = w.interact.lastClientPosition.x - me.clientX;
      const deltaY = ((_a = w.interact.lastClientPosition.y) != null ? _a : 0) - me.clientY;
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
    w.interact.lastClientPosition = {
      x: me.clientX,
      y: me.clientY
    };
    const xLowestValue = w.axisFlags.isRangeBar ? w.globals.minY : w.globals.minX;
    const xHighestValue = w.axisFlags.isRangeBar ? w.globals.maxY : w.globals.maxX;
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
    const w = this.w;
    const xyRatios = this.xyRatios;
    if (!w.globals.initialConfig) return;
    const yaxis = Utils.clone(w.globals.initialConfig.yaxis);
    let xRatio = xyRatios.xRatio;
    let minX = w.globals.minX;
    let maxX = w.globals.maxX;
    if (w.axisFlags.isRangeBar) {
      xRatio = xyRatios.invertedYRatio;
      minX = w.globals.minY;
      maxX = w.globals.maxY;
    }
    if (this.moveDirection === "left") {
      xLowestValue = minX + w.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
      xHighestValue = maxX + w.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
    } else if (this.moveDirection === "right") {
      xLowestValue = minX - w.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
      xHighestValue = maxX - w.layout.gridWidth / PAN_NUDGE_DIVISOR * xRatio;
    }
    if (!w.axisFlags.isRangeBar) {
      const clampMin = (_a = w.globals.dataReducerRawMinX) != null ? _a : w.globals.initialMinX;
      const clampMax = (_b = w.globals.dataReducerRawMaxX) != null ? _b : w.globals.initialMaxX;
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
    if (!w.config.chart.group) {
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
    const w = this.w;
    this.ctx.updateHelpers._updateOptions(options, false, false);
    if (typeof w.config.chart.events.scrolled === "function") {
      const args = {
        xaxis: {
          min: xLowestValue,
          max: xHighestValue
        }
      };
      w.config.chart.events.scrolled(this.ctx, args);
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
    const c2 = this.w.config.chart;
    return !!(c2.pan && c2.pan.inertia);
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
    const w = this.w;
    return w.axisFlags.isRangeBar ? { min: w.globals.minY, max: w.globals.maxY } : { min: w.globals.minX, max: w.globals.maxX };
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
    const w = this.w;
    if (w.axisFlags.isRangeBar) return null;
    return {
      min: (_a = w.globals.dataReducerRawMinX) != null ? _a : w.globals.initialMinX,
      max: (_b = w.globals.dataReducerRawMaxX) != null ? _b : w.globals.initialMaxX
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
    const w = this.w;
    if (!w.globals.initialConfig) return false;
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
    if (w.config.xaxis.convertedCatToNumeric) {
      newMinX = Math.floor(newMinX);
      newMaxX = zoomingOut ? Math.ceil(newMaxX) : Math.floor(newMaxX);
      if (newMinX < 1) newMinX = 1;
      if (bounds && newMaxX > bounds.max) newMaxX = Math.floor(bounds.max);
      if (newMaxX - newMinX < 2) return false;
    }
    if (!(newMaxX > newMinX)) return false;
    const options = { xaxis: { min: newMinX, max: newMaxX } };
    if (!w.config.chart.group) {
      options.yaxis = Utils.clone(w.globals.initialConfig.yaxis);
    }
    if (isZoom) w.interact.zoomed = true;
    this.ctx.updateHelpers._updateOptions(options, false, false);
    return { minX: newMinX, maxX: newMaxX };
  }
  _cancelInertia() {
    const m = this._m();
    if (m.inertiaRAF != null) {
      cancelAnimationFrame(m.inertiaRAF);
      m.inertiaRAF = null;
    }
  }
  _fireScrolled() {
    const w = this.w;
    if (typeof w.config.chart.events.scrolled !== "function") return;
    const { min, max } = this._currentXWindow();
    const args = { xaxis: { min, max } };
    w.config.chart.events.scrolled(this.ctx, args);
    this.ctx.events.fireEvent("scrolled", args);
  }
  /** @param {number} x @param {number} t */
  _pushSample(x, t2) {
    const s2 = this._m().samples;
    s2.push({ x, t: t2 });
    while (s2.length > 6) s2.shift();
  }
  /**
   * Single passive:false handler for all touch phases. Two fingers => pinch /
   * two-finger pan (zoom). One finger, in pan mode => kinetic pan with inertia.
   * @param {any} e
   */
  momentumTouch(e2) {
    const w = this.w;
    const m = this._m();
    const type = e2.type;
    if (type === "touchstart") {
      this._cancelInertia();
      const gridRectDim = this._gridRect();
      if (!gridRectDim) return;
      if (e2.touches.length >= 2 && this._pinchEnabled()) {
        e2.preventDefault();
        m.busy = true;
        m.panState = null;
        this._beginPinch(e2, gridRectDim);
      } else if (e2.touches.length === 1 && this._panInertiaEnabled() && w.interact.panEnabled) {
        m.busy = true;
        m.pinch = null;
        const t2 = e2.touches[0];
        const win = this._currentXWindow();
        const gw = w.layout.gridWidth || 1;
        m.panState = {
          startX: t2.clientX,
          startY: t2.clientY,
          axis: null,
          // decided on first move (rails)
          minX0: win.min,
          maxX0: win.max,
          ratio0: (win.max - win.min) / gw
        };
        m.samples = [{ x: t2.clientX, t: e2.timeStamp }];
      }
      return;
    }
    if (type === "touchmove") {
      if (m.pinch && e2.touches.length >= 2) {
        e2.preventDefault();
        this._movePinch(e2);
      } else if (m.panState && e2.touches.length === 1) {
        this._movePan(e2);
      }
      return;
    }
    if (m.pinch) {
      if (e2.touches.length < 2) this._endPinch();
    } else if (m.panState) {
      if (e2.touches.length === 0) this._endPan();
    }
    if (e2.touches.length === 0) {
      w.interact.mousedown = false;
      this.dragged = false;
      if (m.inertiaRAF == null && !m.pinch && !m.panState) {
        m.busy = false;
      }
    }
  }
  /** @param {any} e @param {DOMRect} gridRectDim */
  _beginPinch(e2, gridRectDim) {
    const w = this.w;
    const t0 = e2.touches[0];
    const t1 = e2.touches[1];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1;
    const cx = (t0.clientX + t1.clientX) / 2 - gridRectDim.left - w.globals.barPadForNumericAxis;
    const { min, max } = this._currentXWindow();
    this._m().pinch = {
      d0: dist,
      cx0: cx,
      minX0: min,
      maxX0: max,
      gridWidth: w.layout.gridWidth || 1
    };
  }
  /** @param {any} e */
  _movePinch(e2) {
    const w = this.w;
    const p = this._m().pinch;
    if (!p) return;
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const t0 = e2.touches[0];
    const t1 = e2.touches[1];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1;
    const cx = (t0.clientX + t1.clientX) / 2 - gridRectDim.left - w.globals.barPadForNumericAxis;
    const range0 = p.maxX0 - p.minX0;
    const newRange = range0 * (p.d0 / dist);
    const anchorData = p.minX0 + p.cx0 / p.gridWidth * range0;
    let newMinX = anchorData - cx / p.gridWidth * newRange;
    let newMaxX = newMinX + newRange;
    const bounds = this._clampBounds();
    if (bounds) {
      const minXDiff = w.globals.minXDiff > 0 && isFinite(w.globals.minXDiff) ? w.globals.minXDiff : 0;
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
    const w = this.w;
    const m = this._m();
    m.pinch = null;
    const { min, max } = this._currentXWindow();
    const xaxis = { min, max };
    const yaxis = w.globals.initialConfig ? Utils.clone(w.globals.initialConfig.yaxis) : [];
    const toolbar = this.ctx.toolbar;
    if (toolbar) toolbar.zoomCallback(xaxis, yaxis);
  }
  /** @param {any} e */
  _movePan(e2) {
    const m = this._m();
    const s2 = m.panState;
    const t2 = e2.touches[0];
    if (!s2.axis) {
      const dx = Math.abs(t2.clientX - s2.startX);
      const dy = Math.abs(t2.clientY - s2.startY);
      if (dx < 6 && dy < 6) {
        this._pushSample(t2.clientX, e2.timeStamp);
        return;
      }
      if (dy > dx) {
        m.busy = false;
        m.panState = null;
        return;
      }
      s2.axis = "x";
    }
    if (s2.axis !== "x") return;
    e2.preventDefault();
    const totalDeltaPx = t2.clientX - s2.startX;
    const deltaData = totalDeltaPx * s2.ratio0;
    this._pushSample(t2.clientX, e2.timeStamp);
    this._applyXRange(s2.minX0 - deltaData, s2.maxX0 - deltaData, false);
  }
  _endPan() {
    const m = this._m();
    const s2 = m.panState;
    m.panState = null;
    let vel = 0;
    const samples = m.samples;
    if (samples.length >= 2) {
      const a2 = samples[0];
      const b = samples[samples.length - 1];
      const dt = b.t - a2.t;
      if (dt > 0) vel = (b.x - a2.x) / dt;
    }
    m.samples = [];
    if (s2 && s2.axis === "x" && this._panInertiaEnabled() && Math.abs(vel) > INERTIA_MIN_RELEASE_VELOCITY) {
      this._startInertia(vel);
    } else {
      m.busy = false;
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
    const w = this.w;
    const m = this._m();
    const cfgFriction = w.config.chart.pan && w.config.chart.pan.friction;
    const friction = typeof cfgFriction === "number" ? Math.min(Math.max(cfgFriction, 0.5), 0.999) : INERTIA_DEFAULT_FRICTION;
    let vel = vel0;
    let lastT = null;
    m.busy = true;
    const step = (ts) => {
      if (w.globals.isDestroyed) {
        m.inertiaRAF = null;
        m.busy = false;
        return;
      }
      if (lastT == null) {
        lastT = ts;
        m.inertiaRAF = requestAnimationFrame(step);
        return;
      }
      const dt = ts - lastT;
      lastT = ts;
      vel *= Math.pow(friction, dt / FRAME_MS_60FPS);
      if (Math.abs(vel) < INERTIA_STOP_VELOCITY) {
        m.inertiaRAF = null;
        m.busy = false;
        this._fireScrolled();
        return;
      }
      const win = this._currentXWindow();
      const gw = w.layout.gridWidth || 1;
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
        m.inertiaRAF = null;
        m.busy = false;
        this._fireScrolled();
        return;
      }
      m.inertiaRAF = requestAnimationFrame(step);
    };
    m.inertiaRAF = requestAnimationFrame(step);
  }
}
ApexCharts__default.registerFeatures({
  toolbar: Toolbar,
  zoomPanSelection: ZoomPanSelection
});
const prefersReducedMotion = ApexCharts.__apex_Animations_prefersReducedMotion;
const applyProgressiveReveal = ApexCharts.__apex_Animations_applyProgressiveReveal;
class Helpers2 {
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
    const w = this.w;
    if (anno.label.orientation === "vertical") {
      const i2 = annoIndex !== null ? annoIndex : 0;
      const xAnno = w.dom.baseEl.querySelector(
        `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i2}']`
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
    const w = this.w;
    if (!annoEl || !anno.label.text || !String(anno.label.text).trim()) {
      return null;
    }
    const gridEl = w.dom.baseEl.querySelector(".apexcharts-grid");
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
    const w = this.w;
    const add = (anno, i2, type) => {
      const annoLabel = w.dom.baseEl.querySelector(
        `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i2}']`
      );
      if (annoLabel) {
        const parent = annoLabel.parentNode;
        const elRect = this.addBackgroundToAnno(annoLabel, anno);
        if (elRect) {
          parent == null ? void 0 : parent.insertBefore(elRect.node, annoLabel);
          const labelX = annoLabel.getAttribute("x");
          if (labelX !== null) {
            applyProgressiveReveal(elRect, parseFloat(labelX), w);
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
    w.config.annotations.xaxis.forEach(
      (anno, i2) => add(anno, i2, "xaxis")
    );
    w.config.annotations.yaxis.forEach(
      (anno, i2) => add(anno, i2, "yaxis")
    );
    w.config.annotations.points.forEach(
      (anno, i2) => add(anno, i2, "point")
    );
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getY1Y2(type, anno) {
    var _a, _b;
    const w = this.w;
    const y = type === "y1" ? anno.y : anno.y2;
    let yP;
    let clipped = false;
    if (this.annoCtx.invertAxis) {
      const labels = w.config.xaxis.convertedCatToNumeric ? w.labelData.categoryLabels : w.labelData.labels;
      const catIndex = labels.indexOf(y);
      const xLabel = w.dom.baseEl.querySelector(
        `.apexcharts-yaxis-texts-g text:nth-child(${catIndex + 1})`
      );
      yP = xLabel ? parseFloat((_a = xLabel.getAttribute("y")) != null ? _a : "0") : (w.layout.gridHeight / labels.length - 1) * (catIndex + 1) - w.globals.barHeight;
      if (anno.seriesIndex !== void 0 && w.globals.barHeight) {
        yP -= w.globals.barHeight / 2 * (w.seriesData.series.length - 1) - w.globals.barHeight * anno.seriesIndex;
      }
    } else {
      const yAxisMap = w.globals.seriesYAxisMap[anno.yAxisIndex];
      if (!yAxisMap || yAxisMap[0] == null || !w.config.yaxis[anno.yAxisIndex]) {
        return { yP: 0, clipped: true };
      }
      const seriesIndex = yAxisMap[0];
      const yPos = w.config.yaxis[anno.yAxisIndex].logarithmic ? new CoreUtils(this.w).getLogVal(
        w.config.yaxis[anno.yAxisIndex].logBase,
        y,
        seriesIndex
      ) / /** @type {any} */
      w.globals.yLogRatio[seriesIndex] : (y - w.globals.minYArr[seriesIndex]) / (w.globals.yRange[seriesIndex] / w.layout.gridHeight);
      yP = w.layout.gridHeight - Math.min(Math.max(yPos, 0), w.layout.gridHeight);
      clipped = yPos > w.layout.gridHeight || yPos < 0;
      if (anno.marker && (anno.y === void 0 || anno.y === null)) {
        yP = 0;
      }
      if ((_b = w.config.yaxis[anno.yAxisIndex]) == null ? void 0 : _b.reversed) {
        yP = yPos;
      }
    }
    if (typeof y === "string" && y.includes("px")) {
      yP = parseFloat(y);
    }
    return { yP, clipped };
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getX1X2(type, anno) {
    const w = this.w;
    const x = type === "x1" ? anno.x : anno.x2;
    const min = this.annoCtx.invertAxis ? w.globals.minY : w.globals.minX;
    const max = this.annoCtx.invertAxis ? w.globals.maxY : w.globals.maxX;
    const range = this.annoCtx.invertAxis ? w.globals.yRange[0] : w.globals.xRange;
    let clipped = false;
    let xP = this.annoCtx.inversedReversedAxis ? (max - x) / (range / w.layout.gridWidth) : (x - min) / (range / w.layout.gridWidth);
    if ((w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !this.annoCtx.invertAxis && !w.axisFlags.dataFormatXNumeric) {
      if (!w.config.chart.sparkline.enabled) {
        xP = this.getStringX(x);
      }
    }
    if (typeof x === "string" && x.includes("px")) {
      xP = parseFloat(x);
    }
    if ((x === void 0 || x === null) && anno.marker) {
      xP = w.layout.gridWidth;
    }
    if (anno.seriesIndex !== void 0 && w.globals.barWidth && !this.annoCtx.invertAxis) {
      xP -= w.globals.barWidth / 2 * (w.seriesData.series.length - 1) - w.globals.barWidth * anno.seriesIndex;
    }
    if (typeof xP !== "number") {
      xP = 0;
      clipped = true;
    }
    if (parseFloat(xP.toFixed(10)) > parseFloat(w.layout.gridWidth.toFixed(10))) {
      xP = w.layout.gridWidth;
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
    const w = this.w;
    let rX = x;
    if (w.config.xaxis.convertedCatToNumeric && w.labelData.categoryLabels.length) {
      const strX = String(x);
      x = w.labelData.categoryLabels.findIndex(
        (l2) => String(l2) === strX
      ) + 1;
    }
    const catIndex = w.labelData.labels.map(
      (item) => Array.isArray(item) ? item.join(" ") : item
    ).indexOf(x);
    const xLabel = w.dom.baseEl.querySelector(
      `.apexcharts-xaxis-texts-g text:nth-child(${catIndex + 1})`
    );
    if (xLabel) {
      rX = parseFloat((_a = xLabel.getAttribute("x")) != null ? _a : "0");
    }
    return rX;
  }
}
class XAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.invertAxis = this.annoCtx.invertAxis;
    this.helpers = new Helpers2(this.annoCtx);
  }
  /**
   * @param {XAxisAnnotations} anno
   * @param {Element} parent
   * @param {number} index
   */
  addXaxisAnnotation(anno, parent, index) {
    const w = this.w;
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
          w.layout.gridHeight + anno.offsetY,
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
        applyProgressiveReveal(line, x1 + anno.offsetX, w);
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
        w.layout.gridHeight + anno.offsetY,
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
      rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
      parent.appendChild(rect.node);
      if (anno.id) {
        rect.node.classList.add(anno.id);
      }
      applyProgressiveReveal(rect, x1 + anno.offsetX, w);
    }
    if (!(clipX1 && clipX2)) {
      const textRects = this.annoCtx.graphics.getTextRects(
        text,
        anno.label.style.fontSize
      );
      const textY = anno.label.position === "top" ? 4 : anno.label.position === "center" ? w.layout.gridHeight / 2 + (anno.label.orientation === "vertical" ? textRects.width / 2 : 0) : w.layout.gridHeight;
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
      applyProgressiveReveal(elText, x1 + anno.label.offsetX, w);
      this.annoCtx.helpers.setOrientations(anno, index);
    }
  }
  drawXAxisAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-xaxis-annotations"
    });
    w.config.annotations.xaxis.map(
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
    this.helpers = new Helpers2(this.annoCtx);
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
    const w = this.w;
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
        rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
        parent.appendChild(rect.node);
        if (anno.id) {
          rect.node.classList.add(anno.id);
        }
      }
    }
    if (drawn) {
      const textX = anno.label.position === "right" ? w.layout.gridWidth : anno.label.position === "center" ? w.layout.gridWidth / 2 : 0;
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
    const w = this.w;
    let width = w.layout.gridWidth;
    if (anno.width.indexOf("%") > -1) {
      width = w.layout.gridWidth * parseInt(anno.width, 10) / 100;
    } else {
      width = parseInt(anno.width, 10);
    }
    return width + anno.offsetX;
  }
  drawYAxisAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-yaxis-annotations"
    });
    w.config.annotations.yaxis.forEach(
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
    this.helpers = new Helpers2(this.annoCtx);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    const w = this.w;
    if (w.globals.collapsedSeriesIndices.indexOf(anno.seriesIndex) > -1) {
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
      applyProgressiveReveal(point, x, w);
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
      applyProgressiveReveal(elText, x, w);
      if (anno.customSVG.SVG) {
        const g = this.annoCtx.graphics.group({
          class: "apexcharts-point-annotations-custom-svg " + anno.customSVG.cssClass
        });
        g.attr({
          transform: `translate(${x + anno.customSVG.offsetX}, ${y + anno.customSVG.offsetY})`
        });
        g.node.innerHTML = anno.customSVG.SVG;
        parent.appendChild(g.node);
        tooltipTargets.push(g.node);
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
    const w = this.w;
    let el = (
      /** @type {HTMLElement | null} */
      w.dom.elWrap.querySelector(".apexcharts-annotation-tooltip")
    );
    if (!el) {
      el = /** @type {HTMLElement} */
      BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "div");
      el.classList.add("apexcharts-tooltip", "apexcharts-annotation-tooltip");
      w.dom.elWrap.appendChild(el);
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
    const w = this.w;
    const tt = anno.tooltip || {};
    if (typeof tt.formatter === "function") {
      return tt.formatter({
        annotation: anno,
        seriesIndex: anno.seriesIndex,
        id: anno.id,
        w
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
    const w = this.w;
    const content = this.getPointTooltipContent(anno);
    if (!content) return;
    const el = this.getPointTooltipEl();
    el.innerHTML = content;
    const theme = anno.tooltip.theme || w.config.tooltip.theme || "light";
    el.classList.remove("apexcharts-theme-light", "apexcharts-theme-dark");
    el.classList.add(`apexcharts-theme-${theme}`);
    el.classList.add("apexcharts-active");
    const wrapRect = w.dom.elWrap.getBoundingClientRect();
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
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-point-annotations"
    });
    w.config.annotations.points.map(
      (anno, index) => {
        this.addPointAnnotation(anno, elg.node, index);
      }
    );
    return elg;
  }
}
const Options = ApexCharts.__apex_Options;
class Annotations {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w, { theme = null, timeScale = null } = {}) {
    this.w = w;
    this.theme = theme;
    this.timeScale = timeScale;
    this.invertAxis = void 0;
    this.inversedReversedAxis = void 0;
    this.graphics = new Graphics(this.w);
    if (this.w.globals.isBarHorizontal) {
      this.invertAxis = true;
    }
    this.helpers = new Helpers2(this);
    this.xAxisAnnotations = new XAnnotations(this);
    this.yAxisAnnotations = new YAnnotations(this);
    this.pointsAnnotations = new PointAnnotations(this);
    if (this.w.globals.isBarHorizontal && this.w.config.yaxis[0].reversed) {
      this.inversedReversedAxis = true;
    }
    this.xDivision = this.w.layout.gridWidth / this.w.globals.dataPoints;
  }
  drawAxesAnnotations() {
    const w = this.w;
    if (w.globals.axisCharts && w.globals.dataPoints) {
      const yAnnotations = this.yAxisAnnotations.drawYAxisAnnotations();
      const xAnnotations = this.xAxisAnnotations.drawXAxisAnnotations();
      const pointAnnotations = this.pointsAnnotations.drawPointAnnotations();
      const initialAnim = w.config.chart.animations.enabled;
      const annoArray = [yAnnotations, xAnnotations, pointAnnotations];
      const annoElArray = [
        xAnnotations.node,
        yAnnotations.node,
        pointAnnotations.node
      ];
      const progressiveAnnos = w.config.chart.type === "line" || w.config.chart.type === "area" || w.config.chart.type === "rangeArea";
      const skipGroupHide = [progressiveAnnos, false, progressiveAnnos];
      for (let i2 = 0; i2 < 3; i2++) {
        w.dom.elGraphical.add(annoArray[i2]);
        if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
          if (w.config.chart.type !== "scatter" && w.config.chart.type !== "bubble" && w.globals.dataPoints > 1 && !skipGroupHide[i2]) {
            annoElArray[i2].classList.add("apexcharts-element-hidden");
          }
        }
        w.globals.delayedElements.push({ el: annoElArray[i2], index: 0 });
      }
      this.helpers.annotationsBackground();
    }
  }
  drawImageAnnos() {
    const w = this.w;
    w.config.annotations.images.map((s2) => {
      this.addImage(s2);
    });
  }
  drawTextAnnos() {
    const w = this.w;
    w.config.annotations.texts.map((t2) => {
      this.addText(t2);
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
    const w = this.w;
    const elText = this.graphics.drawText({
      x,
      y,
      text,
      textAnchor: textAnchor || "start",
      fontSize: fontSize || "12px",
      fontWeight: fontWeight || "regular",
      fontFamily: fontFamily || w.config.chart.fontFamily,
      foreColor: foreColor || w.config.chart.foreColor,
      cssClass: "apexcharts-text " + cssClass ? cssClass : ""
    });
    const parent = w.dom.baseEl.querySelector(appendTo);
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
    const w = this.w;
    const {
      path,
      x = 0,
      y = 0,
      width = 20,
      height = 20,
      appendTo = ".apexcharts-svg"
    } = params;
    const img = w.dom.Paper.image(path);
    img.size(width, height).move(x, y);
    const parent = w.dom.baseEl.querySelector(appendTo);
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
    const w = me.w;
    const parent = w.dom.baseEl.querySelector(`.apexcharts-${type}-annotations`);
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
    const axesAnnoLabel = w.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${index}']`
    );
    const elRect = this.helpers.addBackgroundToAnno(axesAnnoLabel, anno);
    if (elRect) {
      parent.insertBefore(elRect.node, axesAnnoLabel);
    }
    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
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
  _removeAnnotationTooltip(w) {
    const el = w.dom.elWrap && w.dom.elWrap.querySelector(".apexcharts-annotation-tooltip");
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   */
  clearAnnotations(ctx) {
    const w = ctx.w;
    this._removeAnnotationTooltip(w);
    const annos = w.dom.baseEl.querySelectorAll(
      ".apexcharts-yaxis-annotations, .apexcharts-xaxis-annotations, .apexcharts-point-annotations"
    );
    for (let i2 = w.globals.memory.methodsToExec.length - 1; i2 >= 0; i2--) {
      if (w.globals.memory.methodsToExec[i2].label === "addText" || w.globals.memory.methodsToExec[i2].label === "addAnnotation") {
        w.globals.memory.methodsToExec.splice(i2, 1);
      }
    }
    Array.prototype.forEach.call(annos, (a2) => {
      while (a2.firstChild) {
        a2.removeChild(a2.firstChild);
      }
    });
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {string} id
   */
  removeAnnotation(ctx, id) {
    const w = ctx.w;
    this._removeAnnotationTooltip(w);
    const annos = w.dom.baseEl.querySelectorAll(`.${id}`);
    if (annos) {
      w.globals.memory.methodsToExec.map((m, i2) => {
        if (m.id === id) {
          w.globals.memory.methodsToExec.splice(i2, 1);
        }
      });
      Object.keys(w.config.annotations).forEach((key) => {
        const annotationArray = w.config.annotations[key];
        if (Array.isArray(annotationArray)) {
          w.config.annotations[key] = annotationArray.filter((m) => m.id !== id);
        }
      });
      Array.prototype.forEach.call(annos, (a2) => {
        a2.parentElement.removeChild(a2);
      });
    }
  }
}
ApexCharts__default.registerFeatures({ annotations: Annotations });
class KeyboardNavigation {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
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
    const w = this.w;
    const svgEl = w.dom.Paper.node;
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
    const w = this.w;
    const svgEl = w.dom.Paper && w.dom.Paper.node;
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
  _onKeyDown(e2) {
    var _a, _b, _c;
    if (!this._isNavEnabled() || !this.active) return;
    if (e2.shiftKey && (e2.key === "ArrowRight" || e2.key === "ArrowLeft") && this._canPan()) {
      e2.preventDefault();
      this._panBy(e2.key === "ArrowRight" ? 1 : -1);
      return;
    }
    switch (e2.key) {
      case "ArrowRight":
        e2.preventDefault();
        this._move(0, 1);
        break;
      case "ArrowLeft":
        e2.preventDefault();
        this._move(0, -1);
        break;
      case "ArrowUp":
        e2.preventDefault();
        this._move(-1, 0);
        break;
      case "ArrowDown":
        e2.preventDefault();
        this._move(1, 0);
        break;
      case "Home":
        e2.preventDefault();
        this.dataPointIndex = 0;
        this._skipNullForward();
        this._showCurrentPoint();
        break;
      case "End":
        e2.preventDefault();
        this.dataPointIndex = this._getDataPointCount(this.seriesIndex) - 1;
        this._skipNullBackward();
        this._showCurrentPoint();
        break;
      case "Enter":
      case " ":
        e2.preventDefault();
        this._fireClick();
        break;
      case "+":
      case "=":
        if (this._canZoom()) {
          e2.preventDefault();
          (_a = this.ctx.toolbar) == null ? void 0 : _a.handleZoomIn();
          this._announce("Zoomed in");
        }
        break;
      case "-":
      case "_":
        if (this._canZoom()) {
          e2.preventDefault();
          (_b = this.ctx.toolbar) == null ? void 0 : _b.handleZoomOut();
          this._announce("Zoomed out");
        }
        break;
      case "0":
        if (this._canZoom() && this.w.interact.zoomed) {
          e2.preventDefault();
          (_c = this.ctx.toolbar) == null ? void 0 : _c.handleZoomReset();
          this._announce("Zoom reset");
        }
        break;
      case "Escape":
        e2.preventDefault();
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
    const w = this.w;
    return Boolean(
      w.globals.axisCharts && w.config.chart.zoom && w.config.chart.zoom.enabled
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
    const w = this.w;
    const toolbar = this.ctx.toolbar;
    if (!toolbar) return;
    const minX = Number(w.globals.minX);
    const maxX = Number(w.globals.maxX);
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
    const { seriesIndex: i2, dataPointIndex: j } = this;
    const w = this.w;
    const ttCtx = w.globals.tooltip;
    if (!ttCtx || !ttCtx.ttItems) return;
    w.interact.capturedSeriesIndex = i2;
    w.interact.capturedDataPointIndex = j;
    this._applyFocusClass(i2, j);
    this._showTooltip(
      i2,
      j,
      /** @type {any} */
      ttCtx
    );
  }
  _hideFocus() {
    const w = this.w;
    const ttCtx = (
      /** @type {any} */
      w.globals.tooltip
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
      if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.announcements.enabled) {
        tooltipEl.setAttribute("aria-hidden", "true");
      }
    }
    w.dom.baseEl.classList.remove("apexcharts-tooltip-active");
    const xcrosshairs = ttCtx.getElXCrosshairs();
    if (xcrosshairs) xcrosshairs.classList.remove("apexcharts-active");
  }
  // ─── Tooltip display per chart type ───────────────────────────────────────
  /**
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltip(i2, j, ttCtx) {
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
    this._setSyntheticEvent(i2, j, ttCtx);
    w.dom.baseEl.classList.add("apexcharts-tooltip-active");
    tooltipEl.classList.add("apexcharts-active");
    if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.announcements.enabled) {
      tooltipEl.removeAttribute("aria-hidden");
    }
    if (type === "pie" || type === "donut" || type === "polarArea") {
      this._showTooltipNonAxis(i2, j, ttCtx, tooltipEl);
    } else if (type === "radialBar") {
      this._showTooltipRadialBar(i2, j, ttCtx, tooltipEl);
    } else if (type === "heatmap" || type === "treemap") {
      this._showTooltipHeatTree(i2, j, ttCtx, tooltipEl, type);
    } else if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "violin" || type === "rangeBar") {
      this._showTooltipBar(i2, j, ttCtx);
    } else {
      this._showTooltipAxisLine(i2, j, ttCtx);
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
  _setSyntheticEvent(i2, j, ttCtx) {
    const w = this.w;
    const type = w.config.chart.type;
    let clientX = 0;
    let clientY = 0;
    const el = this._getFocusableElement(i2, j);
    if (el) {
      const rect = el.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    } else if (w.globals.pointsArray && w.globals.pointsArray[i2] && w.globals.pointsArray[i2][j]) {
      const pt = w.globals.pointsArray[i2][j];
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
      if (w.globals.pointsArray && w.globals.pointsArray[i2] && w.globals.pointsArray[i2][j]) {
        const pt = w.globals.pointsArray[i2][j];
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
  _showTooltipBar(i2, j, ttCtx) {
    var _a, _b, _c, _d;
    const w = this.w;
    const shared = ttCtx.tConfig.shared && (ttCtx.tooltipUtil.isXoverlap(j) || w.globals.isBarHorizontal) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
    const rangeData = (
      /** @type {any} */
      (_d = (_c = (_b = (_a = w.rangeData.seriesRange) == null ? void 0 : _a[i2]) == null ? void 0 : _b[j]) == null ? void 0 : _c.y) == null ? void 0 : _d[0]
    );
    ttCtx.tooltipLabels.drawSeriesTexts(__spreadProps(__spreadValues(__spreadValues({
      ttItems: ttCtx.ttItems,
      i: i2,
      j
    }, (rangeData == null ? void 0 : rangeData.y1) !== void 0 && { y1: rangeData.y1 }), (rangeData == null ? void 0 : rangeData.y2) !== void 0 && { y2: rangeData.y2 }), {
      shared
    }));
    const parent = `.apexcharts-series[data\\:realIndex='${i2}']`;
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
      ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, i2);
    }
  }
  /**
   * line / area / scatter / bubble / radar / rangeArea
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltipAxisLine(i2, j, ttCtx) {
    const w = this.w;
    const type = w.config.chart.type;
    const sharedConfigured = ttCtx.tConfig.shared;
    const shared = sharedConfigured && ttCtx.tooltipUtil.isXoverlap(j) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: i2,
      j,
      shared
    });
    const isScatterLike = type === "scatter" || type === "bubble";
    const hasVisibleMarkers = w.globals.markers.largestSize > 0;
    if (isScatterLike) {
      this._showScatterBubblePoint(i2, j, ttCtx);
    } else if (hasVisibleMarkers) {
      if (shared) {
        ttCtx.marker.enlargePoints(j);
      } else {
        ttCtx.tooltipPosition.moveDynamicPointOnHover(j, i2);
      }
    } else if (shared) {
      ttCtx.tooltipPosition.moveDynamicPointsOnHover(j);
    } else {
      ttCtx.tooltipPosition.moveDynamicPointOnHover(j, i2);
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
  _showScatterBubblePoint(i2, j, ttCtx) {
    const baseEl = this.w.dom.baseEl;
    if (this._enlargedScatterMarker) {
      ttCtx.marker.oldPointSize(this._enlargedScatterMarker);
      this._enlargedScatterMarker = null;
    }
    const seriesEl = baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i2}']`
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
  _showTooltipNonAxis(i2, j, ttCtx, tooltipEl) {
    const w = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: j,
      shared: false
    });
    const tooltipBound = tooltipEl.getBoundingClientRect();
    const ttWidth = tooltipBound.width || ttCtx.tooltipRect.ttWidth || 0;
    const ttHeight = tooltipBound.height || ttCtx.tooltipRect.ttHeight || 0;
    const sliceEl = w.dom.baseEl.querySelector(`.apexcharts-pie-area[j='${j}']`);
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
  _showTooltipRadialBar(i2, _j, ttCtx, tooltipEl) {
    var _a;
    const w = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: i2,
      shared: false
    });
    const { ttWidth = 0, ttHeight = 0 } = ttCtx.getCachedDimensions();
    const arcEl = w.dom.baseEl.querySelector(
      `.apexcharts-radialbar-series[data\\:realIndex='${i2}'] path`
    );
    if (arcEl) {
      const angle = parseFloat((_a = arcEl.getAttribute("data:angle")) != null ? _a : "") || 0;
      const initialAngle = w.config.plotOptions.radialBar.startAngle || 0;
      const midAngle = initialAngle + angle / 2;
      const centerX = w.layout.gridWidth / 2;
      const centerY = w.layout.gridHeight / 2;
      const radialSize = w.globals.radialSize || Math.min(w.layout.gridWidth, w.layout.gridHeight) / 2;
      const seriesCount = w.seriesData.series.length;
      const trackSize = radialSize / Math.max(seriesCount, 1);
      const outerRadius = radialSize - i2 * trackSize;
      const innerRadius = outerRadius - trackSize;
      const ringRadius = (outerRadius + innerRadius) / 2;
      const centroid = Utils.polarToCartesian(
        centerX,
        centerY,
        ringRadius,
        midAngle
      );
      const x = centroid.x + (w.layout.translateX || 0);
      const y = centroid.y + (w.layout.translateY || 0);
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
  _showTooltipHeatTree(i2, j, ttCtx, tooltipEl, type) {
    var _a, _b;
    const w = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: i2,
      j,
      shared: false
    });
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const ttWidth = tooltipRect.width || ttCtx.tooltipRect.ttWidth || 0;
    const ttHeight = tooltipRect.height || ttCtx.tooltipRect.ttHeight || 0;
    const rectClass = type === "heatmap" ? "apexcharts-heatmap-rect" : "apexcharts-treemap-rect";
    const cell = w.dom.baseEl.querySelector(`.${rectClass}[i='${i2}'][j='${j}']`);
    if (cell) {
      const wrapRect = w.dom.elWrap.getBoundingClientRect();
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
      if (cellCx + cellWidth > w.layout.gridWidth / 2) {
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
  _applyFocusClass(i2, j) {
    this._removeFocusClass();
    const el = this._getFocusableElement(i2, j);
    if (el) {
      el.classList.add("apexcharts-keyboard-focused");
      el.setAttribute("role", "img");
      const label = this._buildPointLabel(i2, j);
      if (label) el.setAttribute("aria-label", label);
      this._focusedEl = el;
    }
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
  _buildPointLabel(i2, j) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    const type = w.config.chart.type;
    const seriesNames = w.seriesData.seriesNames || [];
    const series = w.seriesData.series || [];
    if (type === "pie" || type === "donut" || type === "polarArea") {
      const sliceLabel = (_b = ((_a = w.labelData) == null ? void 0 : _a.labels) && w.labelData.labels[j]) != null ? _b : "";
      const value = Array.isArray(series) ? series[j] : "";
      return sliceLabel ? `${sliceLabel}: ${value}` : `${value}`;
    }
    if (type === "radialBar") {
      const seriesName2 = seriesNames[i2] || `Series ${i2 + 1}`;
      const value = Array.isArray(series) ? series[i2] : "";
      return `${seriesName2}: ${value}`;
    }
    const seriesName = seriesNames[i2] || `Series ${i2 + 1}`;
    const row = Array.isArray(series[i2]) ? series[i2] : [];
    const rawValue = row[j];
    let formattedValue = rawValue == null ? "" : String(rawValue);
    const yFormatter = (_d = (_c = w.formatters) == null ? void 0 : _c.yLabelFormatters) == null ? void 0 : _d[i2];
    if (typeof yFormatter === "function") {
      try {
        formattedValue = yFormatter(rawValue, {
          seriesIndex: i2,
          dataPointIndex: j,
          w
        });
      } catch (e2) {
      }
    }
    let category = "";
    const categoryLabels = (_e = w.labelData) == null ? void 0 : _e.categoryLabels;
    const seriesX = (_g = (_f = w.seriesData) == null ? void 0 : _f.seriesX) == null ? void 0 : _g[i2];
    if (Array.isArray(categoryLabels) && categoryLabels[j] != null) {
      category = String(categoryLabels[j]);
    } else if (Array.isArray(seriesX) && seriesX[j] != null) {
      const xFormatter = (_h = w.formatters) == null ? void 0 : _h.xLabelFormatter;
      if (typeof xFormatter === "function") {
        try {
          category = String(
            xFormatter(seriesX[j], { seriesIndex: i2, dataPointIndex: j, w })
          );
        } catch (e2) {
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
  _getFocusableElement(i2, j) {
    const w = this.w;
    const type = w.config.chart.type;
    const baseEl = w.dom.baseEl;
    if (type === "pie" || type === "donut" || type === "polarArea") {
      return baseEl.querySelector(`.apexcharts-pie-area[j='${j}']`);
    }
    if (type === "heatmap") {
      return baseEl.querySelector(
        `.apexcharts-heatmap-rect[i='${i2}'][j='${j}']`
      );
    }
    if (type === "treemap") {
      return baseEl.querySelector(
        `.apexcharts-treemap-rect[i='${i2}'][j='${j}']`
      );
    }
    if (type === "radialBar") {
      return baseEl.querySelector(
        `.apexcharts-radialbar-series[data\\:realIndex='${i2}'] path`
      );
    }
    if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "violin" || type === "rangeBar") {
      return baseEl.querySelector(
        `.apexcharts-series[data\\:realIndex='${i2}'] path[j='${j}']`
      );
    }
    const marker = baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i2}'] .apexcharts-marker[rel='${j}']`
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
  /**
   * @param {number} si
   */
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
   * @param {number} direction
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
   * @param {number} si
   * @param {number} di
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
  /**
   * Push a short status message to the visually-hidden aria-live region so
   * screen readers announce zoom / pan / reset events that have no inherent
   * tooltip update. Silently no-op if the region is missing or announcements
   * are disabled.
   * @param {string} message
   */
  _announce(message) {
    const w = this.w;
    if (!w.config.chart.accessibility.announcements.enabled) return;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const region = baseEl.querySelector(".apexcharts-sr-status");
    if (!region) return;
    region.textContent = "";
    setTimeout(() => {
      region.textContent = message;
    }, 0);
  }
}
ApexCharts__default.registerFeatures({ keyboardNavigation: KeyboardNavigation });
const parsePath = ApexCharts.__apex_PathMorphing_parsePath;
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
  for (let r2 = 0; r2 < rows; r2++) {
    const cols = baseCols + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const colSize = cols > 0 ? colExtent / cols : 0;
    for (let c2 = 0; c2 < cols; c2++) {
      cells.push(
        horizontal ? {
          x: bbox.x + rowStart,
          y: bbox.y + c2 * colSize,
          width: rowSize,
          height: colSize
        } : {
          x: bbox.x + c2 * colSize,
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
  for (let r2 = 0; r2 < rows; r2++) {
    const cols = baseCols + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const spans = [];
    const raw = intervalsAt(rowStart, rowStart + rowSize, horizontal);
    if (Array.isArray(raw)) {
      for (let s2 = 0; s2 < raw.length; s2++) {
        const iv = raw[s2];
        if (!iv) continue;
        const lo = Math.max(minorLo, Math.min(iv[0], iv[1]));
        const hi = Math.min(minorHi, Math.max(iv[0], iv[1]));
        if (hi > lo) spans.push([lo, hi]);
      }
    }
    if (!spans.length) spans.push([minorLo, minorHi]);
    const totalLen = spans.reduce((a2, s2) => a2 + (s2[1] - s2[0]), 0);
    const exact = spans.map(
      (s2) => totalLen > 0 ? (s2[1] - s2[0]) / totalLen * cols : cols / spans.length
    );
    const share = exact.map((v) => Math.floor(v));
    let used = share.reduce((a2, b) => a2 + b, 0);
    const byFrac = exact.map((v, i2) => ({ i: i2, frac: v - Math.floor(v) })).sort((a2, b) => b.frac - a2.frac);
    for (let k = 0; used < cols; k++, used++) {
      share[byFrac[k % byFrac.length].i]++;
    }
    for (let s2 = 0; s2 < spans.length; s2++) {
      const n2 = share[s2];
      if (n2 <= 0) continue;
      const lo = spans[s2][0];
      const colSize = (spans[s2][1] - lo) / n2;
      for (let c2 = 0; c2 < n2; c2++) {
        cells.push(
          horizontal ? { x: rowStart, y: lo + c2 * colSize, width: rowSize, height: colSize } : { x: lo + c2 * colSize, y: rowStart, width: colSize, height: rowSize }
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
  for (let s2 = 32768; s2 >= 1; s2 /= 2) {
    const rx = (ix & s2) > 0 ? 1 : 0;
    const ry = (iy & s2) > 0 ? 1 : 0;
    d += s2 * s2 * (3 * rx ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        ix = s2 - 1 - ix;
        iy = s2 - 1 - iy;
      }
      const t2 = ix;
      ix = iy;
      iy = t2;
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
  })).sort((a2, b) => a2.d - b.d).map((e2) => e2.item);
}
function parseColor(str) {
  if (!str || typeof str !== "string") return null;
  const s2 = str.trim();
  if (s2[0] === "#") {
    const hex = s2.slice(1);
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
  const m = s2.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p));
    if (parts.length < 3 || parts.some((v) => !isFinite(v))) return null;
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  return null;
}
function makeColorLerp(from, to) {
  const a2 = parseColor(from);
  const b = parseColor(to);
  if (!a2 || !b) return null;
  return (t2) => {
    const r2 = Math.round(a2[0] + (b[0] - a2[0]) * t2);
    const g = Math.round(a2[1] + (b[1] - a2[1]) * t2);
    const bl = Math.round(a2[2] + (b[2] - a2[2]) * t2);
    const al = a2[3] + (b[3] - a2[3]) * t2;
    return al >= 1 ? `rgb(${r2},${g},${bl})` : `rgba(${r2},${g},${bl},${al})`;
  };
}
function easeInOutCubic(t2) {
  return t2 < 0.5 ? 4 * t2 * t2 * t2 : 1 - Math.pow(-2 * t2 + 2, 3) / 2;
}
function runPieceTween({ pieces, duration, onPieceDone, onAllDone }) {
  let cancelled = false;
  const start = Date.now();
  const dur = Math.max(1, duration);
  const write = (p, e2) => {
    const f = p.from;
    const t2 = p.to;
    const el = p.el;
    el.setAttribute("x", String(f.x + (t2.x - f.x) * e2));
    el.setAttribute("y", String(f.y + (t2.y - f.y) * e2));
    el.setAttribute("width", String(Math.max(0, f.width + (t2.width - f.width) * e2)));
    el.setAttribute("height", String(Math.max(0, f.height + (t2.height - f.height) * e2)));
    el.setAttribute("rx", String(Math.max(0, f.rx + (t2.rx - f.rx) * e2)));
    if (p.fill) el.setAttribute("fill", p.fill(e2));
    else if (e2 >= 1 && p.fillEnd) el.setAttribute("fill", p.fillEnd);
  };
  const frame = () => {
    if (cancelled) return;
    const elapsed = Date.now() - start;
    let live = false;
    for (let k = 0; k < pieces.length; k++) {
      const p = pieces[k];
      if (
        /** @type {any} */
        p._done
      ) continue;
      const raw = (elapsed - p.delay) / dur;
      if (raw < 1) live = true;
      if (raw <= 0) continue;
      const t2 = Math.min(1, raw);
      write(p, easeInOutCubic(t2));
      if (t2 >= 1) {
        p._done = true;
        if (onPieceDone) onPieceDone(p);
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
  constructor(w, ctx) {
    this.w = w;
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
      if (newSeries.every((v) => typeof v === "number")) return true;
      return newSeries.every(
        (s2) => s2 && typeof s2 === "object" && Array.isArray(s2.data)
      );
    }
    if (tf === "partition") {
      return true;
    }
    if (tf === "radial") {
      if (newSeries.every((v) => typeof v === "number")) return true;
      return newSeries.length === 1 && newSeries[0] && typeof newSeries[0] === "object" && Array.isArray(newSeries[0].data);
    }
    if (tf === "bar" || tf === "summary") {
      return newSeries.every(
        (s2) => s2 && typeof s2 === "object" && Array.isArray(s2.data)
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
            (_v, i2) => {
              keyOrder.push(`${i2}:0`);
            }
          );
        } else {
          (Array.isArray(newSeries) ? newSeries : []).forEach(
            (s2, seriesIdx) => {
              const data = s2 && Array.isArray(s2.data) ? s2.data : [];
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
    for (const s2 of newSeries) {
      if (!s2 || typeof s2 !== "object" || !Array.isArray(s2.data)) return 0;
      total += s2.data.length;
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
    const g = BrowserAPIs.createElementNS("http://www.w3.org/2000/svg", "g");
    if (!g) return null;
    g.setAttribute("class", "apexcharts-morph-pieces");
    g.setAttribute("pointer-events", "none");
    const cuid = (_b = this.w.globals) == null ? void 0 : _b.cuid;
    if (cuid) g.setAttribute("clip-path", `url(#gridRectBarMask${cuid})`);
    host.appendChild(g);
    this._pieceLayer = g;
    return g;
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
      const p = (
        /** @type {any} */
        probe
      );
      return p.isPointInFill(pt) || typeof p.isPointInStroke === "function" && p.isPointInStroke(pt);
    };
    const SCAN = 48;
    const intervalsAt = (bandLo, bandHi, horizontal) => {
      const lo = horizontal ? bbox.y : bbox.x;
      const hi = lo + (horizontal ? bbox.height : bbox.width);
      if (!(hi > lo)) return null;
      const at = (v, major) => horizontal ? hit(major, v) : hit(v, major);
      const majors = [
        bandLo + (bandHi - bandLo) * 0.1,
        (bandLo + bandHi) / 2,
        bandHi - (bandHi - bandLo) * 0.1
      ];
      const edge = (inside, outside, major) => {
        let a2 = outside;
        let b = inside;
        for (let it = 0; it < 6; it++) {
          const m = (a2 + b) / 2;
          if (at(m, major)) b = m;
          else a2 = m;
        }
        return (a2 + b) / 2;
      };
      const step = (hi - lo) / SCAN;
      const proof = new Array(SCAN + 1).fill(null);
      let any = false;
      for (const major of majors) {
        for (let s2 = 0; s2 <= SCAN; s2++) {
          if (proof[s2] !== null) continue;
          if (at(lo + s2 * step, major)) {
            proof[s2] = major;
            any = true;
          }
        }
      }
      if (!any) return null;
      const out = [];
      let runStart = -1;
      for (let s2 = 0; s2 <= SCAN + 1; s2++) {
        const inside = s2 <= SCAN && proof[s2] !== null;
        if (inside && runStart < 0) runStart = s2;
        if (!inside && runStart >= 0) {
          const last = s2 - 1;
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
      const i2 = parseInt((_a2 = dot.getAttribute("i")) != null ? _a2 : "", 10);
      if (isNaN(i2)) return;
      const cxAttr = dot.getAttribute("cx");
      let x;
      let y;
      let r2 = 3;
      if (cxAttr != null) {
        x = parseFloat(cxAttr);
        y = parseFloat((_b = dot.getAttribute("cy")) != null ? _b : "");
        r2 = parseFloat((_c = dot.getAttribute("r")) != null ? _c : "3") || 3;
      } else {
        const wAttr = parseFloat((_d = dot.getAttribute("width")) != null ? _d : "0") || 0;
        const hAttr = parseFloat((_e = dot.getAttribute("height")) != null ? _e : "0") || 0;
        x = parseFloat((_f = dot.getAttribute("x")) != null ? _f : "") + wAttr / 2;
        y = parseFloat((_g = dot.getAttribute("y")) != null ? _g : "") + hAttr / 2;
        r2 = Math.max(wAttr, hAttr) / 2 || 3;
      }
      if (!isFinite(x) || !isFinite(y)) return;
      let list = byCluster.get(i2);
      if (!list) {
        list = [];
        byCluster.set(i2, list);
      }
      list.push({ el: dot, x, y, r: r2, fill: dot.getAttribute("fill") });
      total++;
    });
    if (total === 0 || total > PIECE_BUDGET) return this._revealPieceHidden();
    const layer = this._makePieceLayer();
    if (!layer) return this._revealPieceHidden();
    const pieces = [];
    const doc = layer.ownerDocument;
    const sourceFam = familyOf(snap.fromType);
    const shapedSource = sourceFam === "summary" || sourceFam === "radial";
    Array.from(byCluster.keys()).sort((a2, b) => a2 - b).forEach((i2) => {
      var _a2;
      const dots = (
        /** @type {any[]} */
        byCluster.get(i2)
      );
      const box = this.getInitialBBoxFor(i2);
      const entry = snap.mapping.get(`${i2}:0`);
      if (!box || !entry) {
        dots.forEach((d) => {
          d.el.removeAttribute("opacity");
          d.el.removeAttribute("data-piece-hidden");
        });
        return;
      }
      const markFill = entry.fill && entry.fill.indexOf("url(") !== 0 ? entry.fill : ((_a2 = this.w.globals.colors) == null ? void 0 : _a2[i2]) || dots[0].fill;
      let prober = null;
      if (shapedSource) {
        const shifted = this.getInitialPathFor(i2, 0);
        if (shifted) prober = this._makeExtentProber(shifted, box, layer);
      }
      const divided = prober ? gridDivideShape(box, dots.length, prober.intervalsAt) : gridDivideRect(box, dots.length);
      if (prober) prober.dispose();
      const cells = sortByHilbert(divided, (c2) => [
        c2.x + c2.width / 2,
        c2.y + c2.height / 2
      ]);
      const ordered = sortByHilbert(dots, (d) => [d.x, d.y]);
      for (let k = 0; k < ordered.length; k++) {
        const cell = cells[k];
        const dot = ordered[k];
        const el = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
        el.setAttribute("data-i", String(i2));
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
    const clusterIdx = Array.from(snap.sourceDots.keys()).sort((a2, b) => a2 - b);
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
          (p) => p.getAttribute("pathTo") || p.getAttribute("d")
        ).filter(Boolean).join(" ");
        if (d) prober = this._makeExtentProber(d, target.bbox, layer);
      }
      const divided = prober ? gridDivideShape(target.bbox, dots.length, prober.intervalsAt) : gridDivideRect(target.bbox, dots.length);
      if (prober) prober.dispose();
      const cells = sortByHilbert(divided, (c2) => [
        c2.x + c2.width / 2,
        c2.y + c2.height / 2
      ]);
      const ordered = sortByHilbert(dots, (d) => [d.x, d.y]);
      const markState = { remaining: ordered.length, els: target.els, tiles: (
        /** @type {any[]} */
        []
      ) };
      for (let m = 0; m < ordered.length; m++) {
        const dot = ordered[m];
        const cell = cells[m];
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
        state.tiles.forEach((t2) => {
          if (t2.parentNode) t2.parentNode.removeChild(t2);
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
      baseEl.querySelectorAll(".apexcharts-pie-series .apexcharts-pie-area").forEach((p, i2) => {
        const d = p.getAttribute("data:pathFinal") || p.getAttribute("d");
        if (!d || !d.trim()) return;
        const box = this._pathBBox(d);
        if (!box) return;
        out.set(`${i2}:0`, {
          realIndex: i2,
          j: 0,
          d,
          bbox: {
            x: box.minX,
            y: box.minY,
            width: box.maxX - box.minX,
            height: box.maxY - box.minY
          },
          fill: p.getAttribute("fill"),
          els: [p]
        });
      });
      return out;
    }
    const wrapClass = fam === "summary" ? `.apexcharts-${toType}-series` : ".apexcharts-bar-series";
    baseEl.querySelectorAll(`${wrapClass} .apexcharts-series`).forEach((group) => {
      var _a2;
      const realIndex = parseInt((_a2 = group.getAttribute("data:realIndex")) != null ? _a2 : "0", 10) || 0;
      let order = 0;
      group.querySelectorAll("path[pathTo]").forEach((p) => {
        var _a3;
        const d = p.getAttribute("pathTo") || p.getAttribute("d");
        if (!d || !d.trim()) return;
        const jAttr = parseInt((_a3 = p.getAttribute("j")) != null ? _a3 : "", 10);
        const j = isNaN(jAttr) ? order++ : jAttr;
        const box = this._pathBBox(d);
        if (!box) return;
        const key = `${realIndex}:${j}`;
        const prev = out.get(key);
        if (prev) {
          prev.els.push(p);
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
            fill: p.getAttribute("fill"),
            els: [p]
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
        paths.forEach((p, j) => {
          const d = p.getAttribute("pathTo") || p.getAttribute("d");
          if (!d) return;
          captured.push({
            realIndex,
            j,
            d,
            fill: p.getAttribute("fill")
          });
        });
      });
    } else if (fam === "summary") {
      const byMark = /* @__PURE__ */ new Map();
      baseEl.querySelectorAll(`.apexcharts-${fromType}-area`).forEach((p) => {
        var _a2, _b;
        const j = parseInt((_a2 = p.getAttribute("j")) != null ? _a2 : "", 10);
        if (isNaN(j)) return;
        const d = p.getAttribute("pathTo") || p.getAttribute("d");
        if (!d || !d.trim()) return;
        const group = typeof p.closest === "function" ? p.closest(".apexcharts-series") : null;
        const realIndex = parseInt((_b = group == null ? void 0 : group.getAttribute("data:realIndex")) != null ? _b : "0", 10) || 0;
        const key = `${realIndex}:${j}`;
        const prev = byMark.get(key);
        if (prev) prev.d += ` ${d}`;
        else byMark.set(key, { realIndex, j, d, fill: p.getAttribute("fill") });
      });
      Array.from(byMark.values()).sort((a2, b) => a2.realIndex - b.realIndex || a2.j - b.j).forEach((m) => captured.push(m));
    } else if (fam === "partition") {
      if (fromType === "treemap") {
        const rectPath = (el) => {
          var _a2, _b, _c, _d;
          const x = parseFloat((_a2 = el.getAttribute("x")) != null ? _a2 : "");
          const y = parseFloat((_b = el.getAttribute("y")) != null ? _b : "");
          const width = parseFloat((_c = el.getAttribute("width")) != null ? _c : "");
          const height = parseFloat((_d = el.getAttribute("height")) != null ? _d : "");
          if (![x, y, width, height].every((v) => isFinite(v))) return null;
          return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
        };
        const tiles = baseEl.querySelectorAll(".apexcharts-treemap-rect");
        tiles.forEach((t2) => {
          var _a2, _b;
          const d = rectPath(t2);
          if (!d) return;
          captured.push({
            realIndex: parseInt((_a2 = t2.getAttribute("i")) != null ? _a2 : "0", 10) || 0,
            j: parseInt((_b = t2.getAttribute("j")) != null ? _b : "0", 10) || 0,
            d,
            fill: t2.getAttribute("fill"),
            key: t2.getAttribute("data:key") || null
          });
        });
        const containers = baseEl.querySelectorAll(
          ".apexcharts-treemap-parent-rect"
        );
        containers.forEach((c2) => {
          const d = rectPath(c2);
          const key = c2.getAttribute("data:key");
          if (!d || !key) return;
          branches.push({ key, d, fill: c2.getAttribute("fill") });
        });
      } else {
        const arcs = baseEl.querySelectorAll(".apexcharts-sunburst-arc");
        const leaves = [];
        arcs.forEach((a2) => {
          if (a2.getAttribute("data:leaf") === "true") leaves.push(a2);
        });
        const source = leaves.length ? leaves : Array.from(arcs);
        source.forEach((a2, i2) => {
          const d = a2.getAttribute("d");
          if (!d || !d.trim()) return;
          captured.push({
            realIndex: i2,
            j: 0,
            d,
            fill: a2.getAttribute("fill"),
            key: a2.getAttribute("data:key") || null
          });
        });
        arcs.forEach((a2) => {
          if (a2.getAttribute("data:leaf") === "true") return;
          const d = a2.getAttribute("d");
          const key = a2.getAttribute("data:key");
          if (!d || !d.trim() || !key) return;
          branches.push({ key, d, fill: a2.getAttribute("fill") });
        });
      }
    } else if (fam === "unit") {
      const dots = baseEl.querySelectorAll(".apexcharts-unit-area");
      const boxes = /* @__PURE__ */ new Map();
      dots.forEach((dot) => {
        var _a2, _b, _c, _d, _e, _f, _g;
        const i2 = parseInt((_a2 = dot.getAttribute("i")) != null ? _a2 : "", 10);
        if (isNaN(i2)) return;
        const cxAttr = dot.getAttribute("cx");
        let x;
        let y;
        let r2 = 3;
        if (cxAttr != null) {
          x = parseFloat(cxAttr);
          y = parseFloat((_b = dot.getAttribute("cy")) != null ? _b : "");
          r2 = parseFloat((_c = dot.getAttribute("r")) != null ? _c : "3") || 3;
        } else {
          const wAttr = parseFloat((_d = dot.getAttribute("width")) != null ? _d : "0") || 0;
          const hAttr = parseFloat((_e = dot.getAttribute("height")) != null ? _e : "0") || 0;
          x = parseFloat((_f = dot.getAttribute("x")) != null ? _f : "") + wAttr / 2;
          y = parseFloat((_g = dot.getAttribute("y")) != null ? _g : "") + hAttr / 2;
          r2 = Math.max(wAttr, hAttr) / 2 || 3;
        }
        if (!isFinite(x) || !isFinite(y)) return;
        let list = unitDots.get(i2);
        if (!list) {
          list = [];
          unitDots.set(i2, list);
        }
        list.push({ x, y, r: r2, fill: dot.getAttribute("fill") });
        const box = boxes.get(i2);
        if (!box) {
          boxes.set(i2, {
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
      Array.from(boxes.keys()).sort((a2, b) => a2 - b).forEach((i2) => {
        const b = (
          /** @type {any} */
          boxes.get(i2)
        );
        const pad = 2;
        const x1 = b.minX - pad;
        const y1 = b.minY - pad;
        const x2 = b.maxX + pad;
        const y2 = b.maxY + pad;
        captured.push({
          realIndex: i2,
          j: 0,
          d: `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`,
          fill: b.fill
        });
      });
    } else if (fam === "radial") {
      if (fromType === "radialBar" || fromType === "gauge") {
        const centerX = this.w.layout.gridWidth / 2;
        const centerY = Math.min(this.w.layout.gridWidth, this.w.layout.gridHeight) / 2;
        const rings = baseEl.querySelectorAll(
          ".apexcharts-radial-series .apexcharts-radialbar-area"
        );
        rings.forEach((p) => {
          var _a2;
          const parent = (
            /** @type {Element|null} */
            p.parentElement
          );
          const realIndex = parseInt(
            (_a2 = parent == null ? void 0 : parent.getAttribute("data:realIndex")) != null ? _a2 : "0",
            10
          );
          const rawD = p.getAttribute("d");
          if (!rawD) return;
          const strokeWidth = parseFloat(p.getAttribute("stroke-width") || "0");
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
            fill: p.getAttribute("stroke")
          });
        });
      } else {
        const slices = baseEl.querySelectorAll(
          ".apexcharts-pie-series .apexcharts-pie-area"
        );
        slices.forEach(
          (p, i2) => {
            const d = p.getAttribute("d");
            if (!d) return;
            captured.push({
              realIndex: i2,
              j: 0,
              d,
              fill: p.getAttribute("fill")
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
    const m = rawD.match(
      /M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+A\s*(-?[\d.]+)\s+(?:-?[\d.]+)\s+(?:-?[\d.]+)\s+(\d)\s+(\d)\s+(-?[\d.]+)\s+(-?[\d.]+)/
    );
    if (!m) return null;
    const x1 = parseFloat(m[1]);
    const y1 = parseFloat(m[2]);
    const r2 = parseFloat(m[3]);
    const large = parseInt(m[4], 10);
    const sweep = parseInt(m[5], 10);
    const x2 = parseFloat(m[6]);
    const y2 = parseFloat(m[7]);
    if (!isFinite(r2) || r2 <= 0) return null;
    const half = strokeWidth / 2;
    const rOuter = r2 + half;
    const rInner = Math.max(0, r2 - half);
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
    const flat = captured.slice().sort((a2, b) => a2.realIndex - b.realIndex || a2.j - b.j);
    if (tf === "partition" && branches && branches.length) {
      const keyedMarks = flat.filter((c2) => c2.key);
      if (keyedMarks.length === flat.length) {
        keyedMarks.forEach((c2) => {
          map.set(`key:${c2.key}`, { d: c2.d, fill: c2.fill });
        });
        branches.forEach((br) => {
          map.set(`key:${br.key}`, { d: br.d, fill: br.fill });
        });
      }
    }
    if (tf === "radial" || tf === "unit" || tf === "partition") {
      flat.forEach((c2, i2) => {
        map.set(`${i2}:0`, { d: c2.d, fill: c2.fill });
      });
      return map;
    }
    if (tf === "bar" || tf === "summary") {
      const positions = [];
      const series = Array.isArray(newSeries) ? newSeries : [];
      series.forEach((s2, seriesIdx) => {
        const data = s2 && Array.isArray(s2.data) ? s2.data : [];
        for (let j = 0; j < data.length; j++) {
          positions.push({ realIndex: seriesIdx, j });
        }
      });
      flat.forEach((c2, i2) => {
        const pos = positions[i2];
        if (pos) {
          map.set(`${pos.realIndex}:${pos.j}`, { d: c2.d, fill: c2.fill });
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
      (c2) => {
        const cmd = c2[0];
        if (cmd === "Z") return "Z";
        if (cmd === "M" || cmd === "L" || cmd === "T") {
          return `${cmd} ${c2[1] + dx} ${c2[2] + dy}`;
        }
        if (cmd === "H") return `${cmd} ${c2[1] + dx}`;
        if (cmd === "V") return `${cmd} ${c2[1] + dy}`;
        if (cmd === "C") {
          return `${cmd} ${c2[1] + dx} ${c2[2] + dy} ${c2[3] + dx} ${c2[4] + dy} ${c2[5] + dx} ${c2[6] + dy}`;
        }
        if (cmd === "S" || cmd === "Q") {
          return `${cmd} ${c2[1] + dx} ${c2[2] + dy} ${c2[3] + dx} ${c2[4] + dy}`;
        }
        if (cmd === "A") {
          return `${cmd} ${c2[1]} ${c2[2]} ${c2[3]} ${c2[4]} ${c2[5]} ${c2[6] + dx} ${c2[7] + dy}`;
        }
        return c2.join(" ");
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
  getInitialCenterFor(i2) {
    const box = this.getInitialBBoxFor(i2);
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
  getInitialSlotFor(i2, j, n2) {
    const box = this.getInitialBBoxFor(i2);
    if (!box) return null;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    if (!(n2 > 1) || !(j >= 0)) return { x: cx, y: cy };
    const t2 = (Math.min(j, n2 - 1) + 0.5) / n2;
    if (box.height >= box.width) {
      return { x: cx, y: box.y + box.height * (1 - t2) };
    }
    return { x: box.x + box.width * t2, y: cy };
  }
  /**
   * The bounding box (in the NEW chart's screen space) of the captured shape
   * for cluster `i`. `getInitialSlotFor` distributes a cluster's objects across
   * this box as their start positions, so a tall bar visibly breaks apart into
   * a tall column of dots that then swarm into the cluster.
   * @param {number} i
   * @returns {{ x: number, y: number, width: number, height: number } | null}
   */
  getInitialBBoxFor(i2) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${i2}:0`);
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
      (c2) => {
        const cmd = c2[0];
        if (cmd === "Z") return;
        let pairs = [];
        if (cmd === "H") pairs = [[c2[1], (minY + maxY) / 2 || c2[1]]];
        else if (cmd === "V") pairs = [[(minX + maxX) / 2 || c2[1], c2[1]]];
        else if (cmd === "A") pairs = [[c2[6], c2[7]]];
        else {
          for (let k = 1; k + 1 < c2.length; k += 2) pairs.push([c2[k], c2[k + 1]]);
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
ApexCharts__default.registerFeatures({ morphTypeChange: MorphTypeChange });
const BREADCRUMB_HEIGHT = 18;
function breadcrumbCeiling(w, nav) {
  const gridTop = w.layout.translateY || 0;
  const elWrap = w.dom.elWrap;
  if (!elWrap) return gridTop;
  const labels = w.dom.baseEl.querySelectorAll(".apexcharts-yaxis-label");
  if (!labels.length) return gridTop;
  const wrapTop = elWrap.getBoundingClientRect().top;
  const navRect = nav.getBoundingClientRect();
  let ceiling = gridTop;
  for (let i2 = 0; i2 < labels.length; i2++) {
    const r2 = labels[i2].getBoundingClientRect();
    if (!r2.height) continue;
    if (r2.left >= navRect.right || r2.right <= navRect.left) continue;
    ceiling = Math.min(ceiling, r2.top - wrapTop);
  }
  return ceiling;
}
function placeInReservedBand(w, ctx, nav, cfg) {
  var _a;
  const dimHelpers = (_a = ctx == null ? void 0 : ctx.dimensions) == null ? void 0 : _a.dimHelpers;
  const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
  const navH = nav.getBoundingClientRect().height || BREADCRUMB_HEIGHT;
  const offsetY = cfg && cfg.offsetY || 0;
  const ceiling = breadcrumbCeiling(w, nav);
  if (ceiling - titleArea >= navH + 1) {
    nav.style.top = `${ceiling - navH - 1 + offsetY}px`;
    return true;
  }
  nav.style.top = `${titleArea + offsetY}px`;
  const dark = w.config.theme.mode === "dark";
  nav.style.background = dark ? "rgba(20,24,30,0.82)" : "rgba(255,255,255,0.86)";
  nav.style.borderRadius = "4px";
  return false;
}
const XHTML$1 = "http://www.w3.org/1999/xhtml";
class Breadcrumb {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {import('./Drilldown').default} drilldown
   */
  constructor(w, ctx, drilldown) {
    this.w = w;
    this.ctx = ctx;
    this.drilldown = drilldown;
  }
  /**
   * @param {Array<string|number>} path - ['root', id, id, ...]
   */
  render(path) {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    const elWrap = w.dom.elWrap;
    if (!elWrap) return;
    const existing = elWrap.querySelector(".apexcharts-breadcrumb");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const cfg = w.config.drilldown && w.config.drilldown.breadcrumb;
    if (!cfg || cfg.show === false) return;
    if (this.drilldown.depth === 0) return;
    const nav = BrowserAPIs.createElementNS(XHTML$1, "nav");
    nav.setAttribute("class", "apexcharts-breadcrumb");
    nav.setAttribute("aria-label", "Drilldown breadcrumb");
    this._position(nav, cfg);
    const separator = cfg.separator != null ? cfg.separator : " / ";
    path.forEach((id, i2) => {
      if (i2 > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML$1, "span");
        sep.setAttribute("class", "apexcharts-breadcrumb-separator");
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        nav.appendChild(sep);
      }
      const label = this._label(id, i2);
      const isCurrent = i2 === path.length - 1;
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML$1, "span");
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
          BrowserAPIs.createElementNS(XHTML$1, "button")
        );
        btn.setAttribute("type", "button");
        btn.setAttribute("class", "apexcharts-breadcrumb-item");
        if (i2 === 0) {
          const arrow = BrowserAPIs.createElementNS(XHTML$1, "span");
          arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "←";
          btn.appendChild(arrow);
        }
        const text = BrowserAPIs.createElementNS(XHTML$1, "span");
        text.setAttribute("class", "apexcharts-breadcrumb-label");
        text.textContent = label;
        btn.appendChild(text);
        btn.addEventListener("click", () => this.drilldown.drillToLevel(i2));
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
    const w = this.w;
    const chrome = (
      /** @type {Element[]} */
      [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s2) => w.dom.baseEl.querySelector(s2)).filter((el) => el !== null)
    );
    if (!chrome.length) return;
    const wrapTop = w.dom.elWrap.getBoundingClientRect().top;
    for (let pass = 0; pass < chrome.length + 1; pass++) {
      const nr = nav.getBoundingClientRect();
      const hit = chrome.find((el) => {
        const r2 = el.getBoundingClientRect();
        return nr.left < r2.right && nr.right > r2.left && nr.top < r2.bottom && nr.bottom > r2.top;
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
        (s2) => s2 && s2.id === id
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
const XHTML = "http://www.w3.org/1999/xhtml";
const CLASS = "apexcharts-drilldown-loading";
class DrilldownLoading {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w;
    this.el = null;
  }
  /** @returns {any} the drilldown.loading config, normalised. */
  _cfg() {
    const d = this.w.config.drilldown;
    const l2 = d && d.loading;
    if (l2 === false) return { show: false };
    return l2 || {};
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
    const box = BrowserAPIs.createElementNS(XHTML, "div");
    box.setAttribute("class", CLASS);
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-label", cfg.text || "Loading");
    const spinner = BrowserAPIs.createElementNS(XHTML, "div");
    spinner.setAttribute("class", `${CLASS}-spinner`);
    spinner.setAttribute("aria-hidden", "true");
    box.appendChild(spinner);
    if (cfg.text) {
      const label = BrowserAPIs.createElementNS(XHTML, "span");
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
      for (let i2 = 0; i2 < nodes.length; i2++) {
        const n2 = nodes[i2];
        if (n2.parentNode) n2.parentNode.removeChild(n2);
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
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.stack = [];
    this.rootSnapshot = null;
    this._wired = false;
    this._asyncCache = /* @__PURE__ */ new Map();
    this._pending = null;
    this._warnedUnreachable = false;
    this._warnedNoSliceOffset = false;
    this.breadcrumb = new Breadcrumb(w, ctx, this);
    this.loading = new DrilldownLoading(w);
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
    this._onPlotDown = this._onPlotDown.bind(this);
    this._onPlotClick = this._onPlotClick.bind(this);
    this._downAt = null;
    this._plotClickWired = null;
    this.init();
  }
  init() {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return;
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("dataPointSelection", this._onPointSelect);
    this.ctx.addEventListener("mounted", this._afterRender);
    this.ctx.addEventListener("updated", this._afterRender);
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series);
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
    return list.find((s2) => s2 && s2.id === id) || null;
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
    const p = Promise.resolve(result).then(
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
    this._pending = p;
    return p;
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
    const w = this.w;
    return !w || !w.globals || w.globals.isDestroyed === true;
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
    const c2 = this.w.config;
    const fields = this._overrideFields();
    const snap = { series: this._uncollapseSeries(Utils.clone(c2.series)) };
    if (Array.isArray(c2.labels) && c2.labels.length) {
      snap.labels = Utils.clone(c2.labels);
    }
    snap.chart = { type: c2.chart.type, stacked: c2.chart.stacked };
    if (fields.has("xaxis")) snap.xaxis = Utils.clone(c2.xaxis);
    if (fields.has("yaxis")) snap.yaxis = Utils.clone(c2.yaxis);
    if (fields.has("colors")) snap.colors = c2.colors ? Utils.clone(c2.colors) : void 0;
    if (fields.has("plotOptions")) snap.plotOptions = Utils.clone(c2.plotOptions);
    if (fields.has("fill")) snap.fill = Utils.clone(c2.fill);
    if (fields.has("legend")) snap.legend = Utils.clone(c2.legend);
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
    const w = this.w;
    const gl = w.globals;
    const entries = [
      ...gl.collapsedSeries || [],
      ...gl.ancillaryCollapsedSeries || []
    ];
    if (!entries.length) return series;
    const type = w.config.chart.type;
    const objectFormPie = (type === "pie" || type === "donut" || type === "polarArea") && series.length === 1 && series[0] && typeof series[0] === "object" && Array.isArray(series[0].data);
    const container = objectFormPie ? series[0].data : series;
    for (const entry of entries) {
      const i2 = entry.index;
      if (gl.axisCharts) {
        if (series[i2]) {
          series[i2].data = Array.isArray(entry.data) ? entry.data.slice() : entry.data;
        }
      } else if (container[i2] && typeof container[i2] === "object") {
        container[i2].y = entry.data;
      } else if (container[i2] !== void 0) {
        container[i2] = entry.data;
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
    for (const s2 of list) {
      if (!s2) continue;
      if (s2.xaxis) fields.add("xaxis");
      if (s2.yaxis) fields.add("yaxis");
      if (s2.colors) fields.add("colors");
      if (s2.plotOptions) fields.add("plotOptions");
      if (s2.fill) fields.add("fill");
      if (s2.legend) fields.add("legend");
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
    const w = this.w;
    w.interact.selectedDataPoints = [];
    w.globals.collapsedSeries = [];
    w.globals.collapsedSeriesIndices = [];
    w.globals.ancillaryCollapsedSeries = [];
    w.globals.ancillaryCollapsedSeriesIndices = [];
    w.globals.allSeriesCollapsed = false;
    w.globals.risingSeries = [];
    view.markers = __spreadProps(__spreadValues({}, view.markers || {}), {
      discrete: this._drillMarkers(view.series)
    });
    const animate = (!w.config.drilldown.animation || w.config.drilldown.animation.enabled !== false) && w.config.chart.animations.enabled !== false;
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
    const a2 = this.w.config.drilldown && this.w.config.drilldown.animation;
    return !!(a2 && a2.zoomFromPoint);
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
      const r2 = el.getBoundingClientRect();
      return {
        x: r2.left + r2.width / 2 - svgRect.left,
        y: r2.top + r2.height / 2 - svgRect.top
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
        } catch (e2) {
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
        } catch (e2) {
        }
        clear(inGroup);
        inAnim.cancel();
      }
    });
  }
  /** @returns {number} per-phase zoom duration in ms. */
  _zoomDuration() {
    const a2 = this.w.config.drilldown && this.w.config.drilldown.animation;
    const speed = a2 && typeof a2.speed === "number" ? a2.speed : 260;
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
    const s2 = series[seriesIndex];
    if (!s2 || !Array.isArray(s2.data)) return null;
    return s2.data[dataPointIndex] != null ? s2.data[dataPointIndex] : null;
  }
  _afterRender() {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return;
    this._markDrillableTargets();
    this._wirePlotClick();
    this.breadcrumb.render(this.path);
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series);
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
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const series = w.config.series;
    if (!baseEl || !Array.isArray(series)) return;
    let unreachable = 0;
    series.forEach((s2, i2) => {
      const data = s2 && Array.isArray(s2.data) ? s2.data : null;
      if (!data) return;
      data.forEach((point, j) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const nodes = baseEl.querySelectorAll(`[index="${i2}"][j="${j}"]`);
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
  _onPlotDown(e2) {
    this._downAt = { x: e2.clientX, y: e2.clientY };
  }
  /**
   * @param {any} e
   * @returns {any}
   */
  _onPlotClick(e2) {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return void 0;
    const down = this._downAt;
    this._downAt = null;
    if (down && Math.hypot(e2.clientX - down.x, e2.clientY - down.y) > 4) {
      return void 0;
    }
    const target = (
      /** @type {Element} */
      e2.target
    );
    if (!target || typeof target.closest !== "function") return void 0;
    if (target.closest(".apexcharts-drilldown-target")) return void 0;
    if (target.closest(
      ".apexcharts-legend, .apexcharts-toolbar, .apexcharts-breadcrumb, .apexcharts-menu, .apexcharts-tooltip"
    )) {
      return void 0;
    }
    const i2 = w.interact.capturedSeriesIndex;
    const j = w.interact.capturedDataPointIndex;
    if (i2 == null || j == null || i2 < 0 || j < 0) return void 0;
    if (!this._isPointBasedSeries(w.config.series[i2])) return void 0;
    const point = this._pointAt(i2, j);
    if (!point || typeof point !== "object" || point.drilldown == null) {
      return void 0;
    }
    return this.drillDown(point.drilldown, point, {
      seriesIndex: i2,
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
    const w = this.w;
    const cfg = w.config.drilldown;
    const authored = Array.isArray(w.config.markers && w.config.markers.discrete) ? w.config.markers.discrete.filter(
      (d) => !d || !d[DRILL_MARKER]
    ) : [];
    const mk = cfg && cfg.marker || {};
    if (mk.show === false || !Array.isArray(series)) return authored;
    const own = [];
    series.forEach((s2, i2) => {
      if (!this._seriesNeedsDrillMarker(i2, s2)) return;
      const data = s2 && Array.isArray(s2.data) ? s2.data : null;
      if (!data) return;
      data.forEach((point, j) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const entry = { seriesIndex: i2, dataPointIndex: j, [DRILL_MARKER]: true };
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
  _seriesNeedsDrillMarker(i2, s2) {
    if (!this._isPointBasedSeries(s2)) return false;
    const size = this.w.config.markers && this.w.config.markers.size;
    const effective = Array.isArray(size) ? size[i2] : size;
    return !(Number(effective) > 0);
  }
  /**
   * A series whose marks are markers (a point), rather than a shape big enough
   * to aim at on its own.
   * @param {any} s
   * @returns {boolean}
   */
  _isPointBasedSeries(s2) {
    const type = s2 && s2.type || this.w.config.chart.type;
    return type === "line" || type === "area";
  }
}
ApexCharts__default.registerFeatures({ drilldown: Drilldown });
const VIEWSTATE_VERSION = 1;
function axisWindow(min, max) {
  const hasMin = min !== void 0 && min !== null;
  const hasMax = max !== void 0 && max !== null;
  if (!hasMin && !hasMax) return null;
  return { min: hasMin ? min : null, max: hasMax ? max : null };
}
function cloneSelection(sel) {
  if (!Array.isArray(sel)) return [];
  return sel.map((a2) => Array.isArray(a2) ? a2.slice() : a2);
}
function annotationKind(method, ctx) {
  if (typeof method !== "function" || !ctx) return null;
  if (method === ctx.addXaxisAnnotation) return "xaxis";
  if (method === ctx.addYaxisAnnotation) return "yaxis";
  if (method === ctx.addPointAnnotation) return "point";
  return null;
}
function addMethodName(kind) {
  switch (kind) {
    case "xaxis":
      return "addXaxisAnnotation";
    case "yaxis":
      return "addYaxisAnnotation";
    case "point":
      return "addPointAnnotation";
    default:
      return null;
  }
}
function captureAnnotations(w, ctx) {
  const staticAnno = w.config.annotations ? Utils.clone(w.config.annotations) : null;
  const dynamic = [];
  const mem = w.globals.memory && w.globals.memory.methodsToExec || [];
  for (const entry of mem) {
    if (!entry || entry.label !== "addAnnotation") continue;
    const kind = annotationKind(entry.method, ctx);
    if (!kind) continue;
    dynamic.push({ kind, params: Utils.clone(entry.params) });
  }
  return { static: staticAnno, dynamic };
}
function captureMeasure(ctx) {
  const m = ctx && ctx.measure;
  if (!m || typeof m.getPins !== "function") return null;
  const pins = m.getPins();
  return Array.isArray(pins) && pins.length ? { pins } : null;
}
function captureViewState(w, ctx) {
  var _a, _b;
  const cfgX = w.config.xaxis || {};
  const cfgYArr = Array.isArray(w.config.yaxis) ? w.config.yaxis : w.config.yaxis ? [w.config.yaxis] : [];
  const yWindows = cfgYArr.map(
    (y) => axisWindow(y && y.min, y && y.max)
  );
  const anyY = yWindows.some((yw) => yw !== null);
  const theme = w.config.theme;
  const drilldown = ctx && ctx.drilldown;
  return {
    v: VIEWSTATE_VERSION,
    window: {
      xaxis: axisWindow(cfgX.min, cfgX.max),
      yaxis: anyY ? yWindows : null
    },
    zoomed: !!w.interact.zoomed,
    collapsed: (w.globals.collapsedSeriesIndices || []).slice(),
    ancillaryCollapsed: (w.globals.ancillaryCollapsedSeriesIndices || []).slice(),
    selectedDataPoints: cloneSelection(w.interact.selectedDataPoints),
    theme: theme ? { mode: (_a = theme.mode) != null ? _a : null, palette: (_b = theme.palette) != null ? _b : null } : null,
    locale: w.config.chart && w.config.chart.defaultLocale || null,
    annotations: captureAnnotations(w, ctx),
    drill: drilldown && drilldown.depth > 0 ? { path: drilldown.path.slice() } : null,
    measure: captureMeasure(ctx)
  };
}
function applyCollapsedSet(ctx, targetCollapsed, targetAncillary) {
  const w = ctx.w;
  if (targetCollapsed == null && targetAncillary == null) return;
  const names = w.globals.seriesNames || [];
  const target = /* @__PURE__ */ new Set([
    ...targetCollapsed || [],
    ...targetAncillary || []
  ]);
  const current = /* @__PURE__ */ new Set([
    ...w.globals.collapsedSeriesIndices || [],
    ...w.globals.ancillaryCollapsedSeriesIndices || []
  ]);
  for (let realIndex = 0; realIndex < names.length; realIndex++) {
    const name = names[realIndex];
    if (name == null) continue;
    const shouldCollapse = target.has(realIndex);
    const isCollapsed = current.has(realIndex);
    if (shouldCollapse && !isCollapsed) {
      ctx.hideSeries(name);
    } else if (!shouldCollapse && isCollapsed) {
      ctx.showSeries(name);
    }
  }
}
function restoreSelection(ctx, selectedDataPoints) {
  if (!Array.isArray(selectedDataPoints)) return;
  ctx.w.interact.selectedDataPoints = cloneSelection(selectedDataPoints);
}
function applyViewState(ctx, view, { animate = true, mergeOptions } = {}) {
  var _a, _b;
  if (!ctx || !view) return;
  if (typeof view.v === "number" && view.v > VIEWSTATE_VERSION) {
    console.warn(
      `[apexcharts] ViewState v${view.v} is newer than this build understands (v${VIEWSTATE_VERSION}); applying best-effort.`
    );
  }
  ctx.clearAnnotations();
  const options = mergeOptions ? Utils.clone(mergeOptions) : {};
  const xw = view.window && view.window.xaxis;
  options.xaxis = Object.assign(
    {},
    options.xaxis,
    xw ? { min: (_a = xw.min) != null ? _a : void 0, max: (_b = xw.max) != null ? _b : void 0 } : { min: void 0, max: void 0 }
  );
  const yw = view.window && view.window.yaxis;
  if (Array.isArray(yw)) {
    options.yaxis = yw.map(
      (y) => {
        var _a2, _b2;
        return y ? { min: (_a2 = y.min) != null ? _a2 : void 0, max: (_b2 = y.max) != null ? _b2 : void 0 } : {};
      }
    );
  }
  if (view.theme) {
    const theme = {};
    if (view.theme.mode != null) theme.mode = view.theme.mode;
    if (view.theme.palette != null) theme.palette = view.theme.palette;
    if (Object.keys(theme).length) {
      options.theme = Object.assign({}, options.theme, theme);
    }
  }
  if (view.annotations && view.annotations.static) {
    options.annotations = Utils.clone(view.annotations.static);
  }
  ctx.updateOptions(
    options,
    false,
    animate,
    false,
    false
  );
  applyViewInteraction(ctx, view);
}
function applyViewInteraction(ctx, view) {
  if (!ctx || !view) return;
  const w = ctx.w;
  w.interact.zoomed = !!view.zoomed;
  applyCollapsedSet(ctx, view.collapsed, view.ancillaryCollapsed);
  if (view.annotations && Array.isArray(view.annotations.dynamic)) {
    view.annotations.dynamic.forEach((a2) => {
      const method = addMethodName(a2.kind);
      if (method && typeof ctx[method] === "function") {
        ctx[method](a2.params, true);
      }
    });
  }
  restoreSelection(ctx, view.selectedDataPoints);
  if (view.locale && view.locale !== w.config.chart.defaultLocale) {
    ctx.setLocale(view.locale);
  }
  if (ctx.measure && typeof ctx.measure.setPins === "function") {
    ctx.measure.setPins(view.measure && view.measure.pins || []);
  }
}
const e = globalThis.console;
function t(t2) {
  e.error(t2);
}
function s(t2) {
  e.warn(t2);
}
const i = "APEX-", n = /* @__PURE__ */ new Date("2027-07-31T00:00:00Z"), r = "__apex_license_v1__";
function a() {
  const e2 = globalThis;
  let t2 = e2[r];
  return t2 || (t2 = { key: null, listeners: /* @__PURE__ */ new Set(), result: null }, e2[r] = t2), t2;
}
const l = class {
  static get licenseKey() {
    return a().key;
  }
  static set licenseKey(e2) {
    a().key = e2;
  }
  static get listeners() {
    return a().listeners;
  }
  static get validationResult() {
    return a().result;
  }
  static set validationResult(e2) {
    a().result = e2;
  }
  static getKey() {
    return this.licenseKey;
  }
  static getLicenseStatus() {
    return this.licenseKey ? (this.validationResult = this.validateKey(this.licenseKey), this.validationResult) : { expired: false, signatureVerified: false, valid: false };
  }
  static isKeyValid(e2) {
    return !!e2 && this.validateKey(e2).valid;
  }
  static isLicenseValid() {
    return this.getLicenseStatus().valid;
  }
  static onChange(e2) {
    return this.listeners.add(e2), () => {
      this.listeners.delete(e2);
    };
  }
  static setLicense(e2) {
    var _a;
    var i2;
    if (!e2) return this.licenseKey = null, void this.publish({ expired: false, signatureVerified: false, valid: false });
    const n2 = this.validateKey(e2);
    n2.valid || e2 === this.licenseKey || !(null == (i2 = this.validationResult) ? void 0 : i2.valid) ? (this.licenseKey = e2, this.publish(n2), n2.valid || t(`[Apex] ${n2.message}`)) : s(`[Apex] Ignoring license key: ${(_a = n2.message) != null ? _a : "it is not valid"} A valid license is already active on this page.`);
  }
  static validateKey(e2) {
    const t2 = this.parseKey(e2), s2 = this.validateStructure(e2, t2);
    if (!s2.valid || !(null == t2 ? void 0 : t2.signature)) return s2;
    const i2 = this.verdicts.get(e2);
    return false === i2 ? { data: t2.data, expired: false, message: "Invalid license key. The license signature does not verify.", signatureVerified: true, valid: false } : (void 0 === i2 && this.verifySignature(e2, t2, s2), __spreadProps(__spreadValues({}, s2), { signatureVerified: true === i2 }));
  }
  static _resetSignatureState() {
    this.verdicts.clear(), this.verifying.clear(), this.warnedUnverifiable = false, this.epoch++;
  }
  static base64ToBytes(e2) {
    const t2 = e2.replace(/-/g, "+").replace(/_/g, "/"), s2 = t2.padEnd(4 * Math.ceil(t2.length / 4), "="), i2 = globalThis.atob;
    if ("function" != typeof i2) throw new Error("no base64 decoder available");
    const n2 = i2(s2), r2 = new Uint8Array(n2.length);
    for (let e3 = 0; e3 < n2.length; e3++) r2[e3] = n2.charCodeAt(e3);
    return r2;
  }
  static canonicalPayload(e2) {
    const t2 = e2.domains && e2.domains.length > 0 ? e2.domains.join(",") : "";
    return `v1|${e2.issueDate}|${e2.expiryDate}|${e2.plan}|${t2}`;
  }
  static notify(e2) {
    for (const t2 of this.listeners) try {
      t2(e2);
    } catch (e3) {
    }
  }
  static parseKey(e2) {
    if ("string" != typeof e2 || !e2.startsWith(i)) return null;
    const t2 = e2.slice(5);
    if (!t2) return null;
    try {
      const e3 = new TextDecoder().decode(this.base64ToBytes(t2)), s2 = JSON.parse(e3);
      return s2.issueDate && s2.expiryDate && s2.plan ? { data: { domains: Array.isArray(s2.domains) ? s2.domains : void 0, expiryDate: s2.expiryDate, issueDate: s2.issueDate, plan: s2.plan, valid: true }, signature: "string" == typeof s2.sig && s2.sig ? s2.sig : null } : null;
    } catch (e3) {
      return null;
    }
  }
  static publish(e2) {
    this.validationResult = e2, this.notify(e2);
  }
  static validateStructure(e2, t2) {
    const s2 = (e3) => ({ expired: false, message: e3, signatureVerified: false, valid: false });
    if ("string" != typeof e2 || !e2.startsWith(i)) return s2('Invalid license key format. License key must start with "APEX-".');
    if (!t2) return s2("Invalid license key. Unable to decode license data.");
    const { data: r2, signature: a2 } = t2;
    if (!a2 && /* @__PURE__ */ new Date() >= n) return s2("This license key is in the old unsigned format, which is no longer accepted. Please request a replacement key.");
    if (new Date(r2.expiryDate) < /* @__PURE__ */ new Date()) return { data: r2, expired: true, message: `License expired on ${r2.expiryDate}. Please renew your license.`, signatureVerified: false, valid: false };
    if (r2.domains && r2.domains.length > 0) {
      const e3 = "undefined" == typeof location ? "" : location.hostname;
      if (!r2.domains.some(((t3) => e3 === t3 || e3.endsWith(`.${t3}`)))) return { data: r2, expired: false, message: `License is not valid for this domain (${e3}). Allowed domains: ${r2.domains.join(", ")}.`, signatureVerified: false, valid: false };
    }
    return { data: r2, expired: false, signatureVerified: false, valid: true };
  }
  static verifySignature(e2, i2, n2) {
    return __async(this, null, function* () {
      var r2;
      if (this.verifying.has(e2) || this.verdicts.has(e2)) return;
      this.verifying.add(e2);
      const a2 = this.epoch, l2 = null == (r2 = globalThis.crypto) ? void 0 : r2.subtle;
      if (!l2 || 0 === this.publicKeysSpki.length) return this.verifying.delete(e2), void (this.warnedUnverifiable || (this.warnedUnverifiable = true, s(l2 ? "[Apex] No license signing key is configured in this build, so license signatures cannot be verified." : "[Apex] Web Crypto is unavailable (a secure context is required), so the license signature cannot be verified.")));
      const o2 = new TextEncoder().encode(this.canonicalPayload(i2.data));
      let c2 = false;
      for (const e3 of this.publicKeysSpki) {
        try {
          const t2 = yield l2.importKey("spki", this.base64ToBytes(e3), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
          c2 = yield l2.verify({ hash: "SHA-256", name: "ECDSA" }, t2, this.base64ToBytes(i2.signature), o2);
        } catch (e4) {
          c2 = false;
        }
        if (c2) break;
      }
      if (this.verifying.delete(e2), this.epoch !== a2) return;
      if (this.verdicts.set(e2, c2), c2) {
        const t2 = __spreadProps(__spreadValues({}, n2), { signatureVerified: true });
        return void (this.licenseKey === e2 ? this.publish(t2) : this.notify(t2));
      }
      const h2 = "Invalid license key. The license signature does not verify.", d = { data: i2.data, expired: false, message: h2, signatureVerified: true, valid: false };
      this.licenseKey === e2 ? this.publish(d) : this.notify(d), t(`[Apex] ${h2}`);
    });
  }
};
l.publicKeysSpki = ["MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQIaK9UMD6n0oR/FIy8QdL0uSzKMQlf1BB+tOrji4/WuHsyRNxeDhVykoSsNURozMi1xhmqWvBH1L//xIfugTPA=="], l.verdicts = /* @__PURE__ */ new Map(), l.verifying = /* @__PURE__ */ new Set(), l.warnedUnverifiable = false, l.epoch = 0;
let o = l;
const c = class {
  static applyStyles(e2) {
    Object.assign(e2.style, this.CRITICAL_STYLES, { backgroundImage: this.createWatermarkPattern(), backgroundRepeat: "repeat" });
  }
  static node(e2) {
    return e2 ? e2.querySelector(`[${this.WATERMARK_ATTR}]`) : null;
  }
  static add(e2, t2) {
    return e2 && "undefined" != typeof document ? (this.setManaged(e2, t2), this.paint(e2)) : null;
  }
  static exists(e2) {
    return !!this.node(e2);
  }
  static remove(e2, t2) {
    e2 && (this.setManaged(e2, t2), this.erase(e2));
  }
  static untrack(e2) {
    this.managed.delete(e2);
  }
  static createWatermarkPattern() {
    const e2 = this.WATERMARK_TEXT;
    return `url("data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif"
          font-size="18"
          font-weight="600"
          fill="rgba(134, 134, 134, 0.1)"
          transform="rotate(-35, 100, 60)"
        >${e2}</text>
      </svg>
    `.trim())}")`;
  }
  static erase(e2) {
    var t2;
    null == (t2 = this.node(e2)) || t2.remove();
  }
  static paint(e2) {
    let t2 = this.node(e2);
    return t2 || (t2 = document.createElement("div"), t2.setAttribute(this.WATERMARK_ATTR, ""), e2.appendChild(t2)), this.applyStyles(t2), "function" == typeof getComputedStyle && "static" === getComputedStyle(e2).position && (e2.style.position = "relative"), t2;
  }
  static reconcile() {
    const e2 = o.isLicenseValid();
    for (const t2 of this.managed) t2.isConnected ? e2 ? this.erase(t2) : this.paint(t2) : this.managed.delete(t2);
  }
  static setManaged(e2, t2) {
    false !== (null == t2 ? void 0 : t2.manage) ? this.track(e2) : this.managed.delete(e2);
  }
  static track(e2) {
    this.managed.add(e2), this.subscribed || (this.subscribed = true, o.onChange((() => {
      this.reconcile();
    })));
  }
};
c.WATERMARK_ATTR = "data-apexcharts-watermark", c.WATERMARK_TEXT = "APEXCHARTS", c.ATTR = "data-apexcharts-watermark", c.CRITICAL_STYLES = { bottom: "0", display: "block", left: "0", msUserSelect: "none", opacity: "1", pointerEvents: "none", position: "absolute", right: "0", top: "0", userSelect: "none", visibility: "visible", webkitUserSelect: "none", zIndex: "10000" }, c.managed = /* @__PURE__ */ new Set(), c.subscribed = false;
let h = c;
const X = "__apexcharts_crossfilters__";
function Y(e2) {
  if (!Number.isFinite(e2)) return e2;
  const t2 = Number(e2.toPrecision(12));
  return Object.is(t2, -0) ? 0 : t2;
}
function Z(e2) {
  return "number" == typeof e2 && Number.isFinite(e2);
}
function J(e2) {
  if ("function" == typeof e2) return e2;
  if (e2 && "object" == typeof e2) {
    if ("string" == typeof e2.sum) {
      const t2 = e2.sum;
      return (e3) => e3.reduce(((e4, s2) => e4 + (Number(s2[t2]) || 0)), 0);
    }
    if ("string" == typeof e2.avg) {
      const t2 = e2.avg;
      return (e3) => e3.length ? e3.reduce(((e4, s2) => e4 + (Number(s2[t2]) || 0)), 0) / e3.length : 0;
    }
    if ("string" == typeof e2.min) {
      const t2 = e2.min;
      return (e3) => e3.length ? Math.min(...e3.map(((e4) => Number(e4[t2]) || 0))) : 0;
    }
    if ("string" == typeof e2.max) {
      const t2 = e2.max;
      return (e3) => e3.length ? Math.max(...e3.map(((e4) => Number(e4[t2]) || 0))) : 0;
    }
  }
  return (e3) => e3.length;
}
function G(e2, t2) {
  return "function" == typeof t2 ? e2.slice().sort(t2) : "asc" === t2 ? e2.slice().sort(((e3, t3) => e3 > t3 ? 1 : e3 < t3 ? -1 : 0)) : "desc" === t2 ? e2.slice().sort(((e3, t3) => e3 < t3 ? 1 : e3 > t3 ? -1 : 0)) : e2;
}
function ee(e2, t2) {
  if (!Z(e2)) return -1;
  const s2 = t2.length - 1;
  if (e2 < t2[0] || e2 > t2[s2]) return -1;
  if (e2 === t2[s2]) return s2 - 1;
  for (let i2 = 0; i2 < s2; i2++) if (e2 >= t2[i2] && e2 < t2[i2 + 1]) return i2;
  return -1;
}
function te(e2) {
  const t2 = [];
  for (let s2 = 0; s2 < e2.length - 1; s2++) t2.push(Y((e2[s2] + e2[s2 + 1]) / 2));
  return t2;
}
class se {
  constructor(e2, t2) {
    this.dims = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Map(), this.id = e2, this.records = Array.isArray(t2) ? t2 : [];
  }
  static store() {
    const e2 = globalThis;
    return e2[X] || (e2[X] = /* @__PURE__ */ new Map()), e2[X];
  }
  static getOrCreate(e2) {
    if (!e2 || "string" != typeof e2.id) throw new Error("Crossfilter.getOrCreate requires an { id } string.");
    const t2 = se.store(), s2 = t2.get(e2.id);
    if (s2) return e2.records && s2.setRecords(e2.records), s2;
    const i2 = new se(e2.id, e2.records);
    return t2.set(e2.id, i2), i2;
  }
  static get(e2) {
    return se.store().get(e2) || null;
  }
  setRecords(e2) {
    return this.records = Array.isArray(e2) ? e2 : [], this.dims.forEach(((e3) => this.recomputeDomain(e3))), this.emit("records", this.state()), this.emit("change", this.state()), this;
  }
  registerDimension(e2, t2) {
    if (!t2 || "function" != typeof t2.dimension) throw new Error(`crossfilter.registerDimension("${e2}") needs a dimension function.`);
    const s2 = t2.type || (t2.bins ? "range" : "category"), i2 = { accessor: t2.dimension, reducer: J(t2.reduce), type: s2, bins: t2.bins, order: t2.order, filter: null, labels: [], edges: null, xLabels: [], yLabels: [] };
    return this.dims.set(e2, i2), this.recomputeDomain(i2), null != t2.filter && this.setFilterOn(i2, t2.filter), this;
  }
  hasDimension(e2) {
    return this.dims.has(e2);
  }
  removeDimension(e2) {
    const t2 = this.dims.get(e2), s2 = !!t2 && this.hasFilter(t2);
    return this.dims.delete(e2), s2 && this.emit("change", this.state()), this;
  }
  recomputeDomain(e2) {
    if ("matrix" === e2.type) {
      const t2 = (function(e3, t3, s2) {
        const i2 = /* @__PURE__ */ new Set(), n2 = /* @__PURE__ */ new Set(), r2 = [], a2 = [];
        for (let s3 = 0; s3 < e3.length; s3++) {
          const l2 = t3(e3[s3]);
          if (!l2) continue;
          const o2 = l2[0], c2 = l2[1];
          null == o2 || i2.has(o2) || (i2.add(o2), r2.push(o2)), null == c2 || n2.has(c2) || (n2.add(c2), a2.push(c2));
        }
        return { xLabels: G(r2, s2), yLabels: G(a2, s2) };
      })(this.records, e2.accessor, e2.order);
      return e2.xLabels = t2.xLabels, e2.yLabels = t2.yLabels, void (e2.edges = null);
    }
    if ("range" === e2.type) return e2.edges = (function(e3, t2, s2) {
      if (s2 && Array.isArray(s2.thresholds) && s2.thresholds.length >= 2) {
        const e4 = Array.from(new Set(s2.thresholds.filter(Z))).sort(((e5, t3) => e5 - t3));
        return e4.length >= 2 ? e4.map(Y) : [0, 1];
      }
      let i2 = 1 / 0, n2 = -1 / 0;
      for (let s3 = 0; s3 < e3.length; s3++) {
        const r3 = t2(e3[s3]);
        Z(r3) && (r3 < i2 && (i2 = r3), r3 > n2 && (n2 = r3));
      }
      if (i2 === 1 / 0) return [0, 1];
      if (i2 === n2) {
        const e4 = Math.abs(i2) > 0 ? Math.abs(i2) : 1;
        return [Y(i2), Y(i2 + e4)];
      }
      if (s2 && Z(s2.width) && s2.width > 0) {
        const e4 = s2.width, t3 = Math.floor(i2 / e4) * e4;
        let r3 = Math.ceil(n2 / e4) * e4;
        r3 <= t3 && (r3 = t3 + e4);
        const a3 = Math.max(1, Math.round((r3 - t3) / e4)), l3 = new Array(a3 + 1);
        for (let s3 = 0; s3 <= a3; s3++) l3[s3] = Y(t3 + s3 * e4);
        return l3;
      }
      const r2 = s2 && Z(s2.count) && s2.count >= 1 ? Math.floor(s2.count) : 30, a2 = (n2 - i2) / r2, l2 = new Array(r2 + 1);
      for (let e4 = 0; e4 <= r2; e4++) l2[e4] = Y(i2 + e4 * a2);
      return l2[r2] = Y(n2), l2;
    })(this.records, e2.accessor, e2.bins), void (e2.labels = te(e2.edges));
    if (e2.labels = (function(e3, t2, s2) {
      const i2 = /* @__PURE__ */ new Set(), n2 = [];
      for (let s3 = 0; s3 < e3.length; s3++) {
        const r2 = t2(e3[s3]);
        null != r2 && (i2.has(r2) || (i2.add(r2), n2.push(r2)));
      }
      return G(n2, s2);
    })(this.records, e2.accessor, e2.order), e2.edges = null, e2.filter instanceof Set) {
      const t2 = new Set(e2.labels);
      Array.from(e2.filter).forEach(((s2) => {
        t2.has(s2) || e2.filter.delete(s2);
      }));
    }
  }
  filter(e2, t2) {
    const s2 = this.dims.get(e2);
    return s2 ? (this.setFilterOn(s2, t2), this.emit("change", this.state()), this) : this;
  }
  toggleKey(e2, t2) {
    const s2 = this.dims.get(e2);
    if (!s2 || "category" !== s2.type) return this;
    s2.filter instanceof Set || (s2.filter = /* @__PURE__ */ new Set());
    const i2 = s2.filter;
    return i2.has(t2) ? i2.delete(t2) : i2.add(t2), 0 === i2.size && (s2.filter = null), this.emit("change", this.state()), this;
  }
  setFilterOn(e2, t2) {
    if (null == t2) return void (e2.filter = null);
    if ("range" === e2.type) {
      if (Array.isArray(t2) && 2 === t2.length && t2.every(Z)) {
        const [s3, i2] = t2;
        e2.filter = [Math.min(s3, i2), Math.max(s3, i2)];
      } else e2.filter = null;
      return;
    }
    const s2 = new Set(t2);
    e2.filter = s2.size ? s2 : null;
  }
  clear(e2) {
    const t2 = this.dims.get(e2);
    return t2 && (t2.filter = null), this.emit("change", this.state()), this;
  }
  reset() {
    return this.dims.forEach(((e2) => {
      e2.filter = null;
    })), this.emit("change", this.state()), this;
  }
  hasFilter(e2) {
    return null != e2.filter && (!(e2.filter instanceof Set) || e2.filter.size > 0);
  }
  passes(e2, t2) {
    if (!this.hasFilter(e2)) return true;
    const s2 = e2.accessor(t2);
    if (e2.filter instanceof Set) return e2.filter.has(s2);
    if (!Z(s2)) return false;
    const [i2, n2] = e2.filter;
    return s2 >= i2 && s2 <= n2;
  }
  filteredRecords(e2) {
    const t2 = [];
    return this.dims.forEach(((s2, i2) => {
      i2 !== e2 && this.hasFilter(s2) && t2.push(s2);
    })), 0 === t2.length ? this.records : this.records.filter(((e3) => t2.every(((t3) => this.passes(t3, e3)))));
  }
  filteredRows() {
    return this.filteredRecords(null);
  }
  aggregateFor(e2) {
    const t2 = this.dims.get(e2);
    if (!t2) return { type: "category", labels: [], values: [], keys: [] };
    const s2 = this.filteredRecords(e2);
    if ("matrix" === t2.type) {
      const e3 = new Map(t2.xLabels.map(((e4, t3) => [e4, t3]))), i3 = new Map(t2.yLabels.map(((e4, t3) => [e4, t3]))), n2 = t2.yLabels.map((() => t2.xLabels.map((() => []))));
      for (let r2 = 0; r2 < s2.length; r2++) {
        const a2 = t2.accessor(s2[r2]);
        if (!a2) continue;
        const l2 = e3.get(a2[0]), o2 = i3.get(a2[1]);
        null != l2 && null != o2 && n2[o2][l2].push(s2[r2]);
      }
      return { type: "matrix", xLabels: t2.xLabels.slice(), yLabels: t2.yLabels.slice(), matrix: n2.map(((e4) => e4.map(((e5) => t2.reducer(e5))))) };
    }
    if ("range" === t2.type) {
      const e3 = t2.edges || [0, 1], i3 = e3.length - 1, n2 = Array.from({ length: i3 }, (() => []));
      for (let i4 = 0; i4 < s2.length; i4++) {
        const r2 = ee(t2.accessor(s2[i4]), e3);
        r2 >= 0 && n2[r2].push(s2[i4]);
      }
      return { type: "range", labels: te(e3), values: n2.map(((e4) => t2.reducer(e4))), keys: n2.map(((t3, s3) => [e3[s3], e3[s3 + 1]])), edges: e3 };
    }
    const i2 = /* @__PURE__ */ new Map();
    t2.labels.forEach(((e3) => i2.set(e3, [])));
    for (let e3 = 0; e3 < s2.length; e3++) {
      const n2 = i2.get(t2.accessor(s2[e3]));
      n2 && n2.push(s2[e3]);
    }
    return { type: "category", labels: t2.labels.slice(), values: t2.labels.map(((e3) => t2.reducer(i2.get(e3) || []))), keys: t2.labels.slice() };
  }
  aggregateAll() {
    const e2 = {};
    return this.dims.forEach(((t2, s2) => {
      e2[s2] = this.aggregateFor(s2);
    })), e2;
  }
  state() {
    const e2 = {};
    return this.dims.forEach(((t2, s2) => {
      this.hasFilter(t2) && (e2[s2] = t2.filter instanceof Set ? Array.from(t2.filter) : t2.filter.slice());
    })), { filters: e2, filteredCount: this.filteredRows().length, total: this.records.length };
  }
  filterOf(e2) {
    const t2 = this.dims.get(e2);
    return t2 && this.hasFilter(t2) ? t2.filter instanceof Set ? new Set(t2.filter) : t2.filter.slice() : null;
  }
  on(e2, t2) {
    let s2 = this.listeners.get(e2);
    return s2 || (s2 = /* @__PURE__ */ new Set(), this.listeners.set(e2, s2)), s2.add(t2), () => this.off(e2, t2);
  }
  off(e2, t2) {
    var s2;
    return null == (s2 = this.listeners.get(e2)) || s2.delete(t2), this;
  }
  emit(e2, t2) {
    var s2;
    null == (s2 = this.listeners.get(e2)) || s2.forEach(((e3) => {
      try {
        e3(t2);
      } catch (e4) {
      }
    }));
  }
  static esc(e2) {
    return String(null == e2 ? "" : e2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  resolveColumns(e2) {
    if (Array.isArray(e2) && e2.length) return e2.map(((e3) => "string" == typeof e3 ? { field: e3, label: e3 } : { field: e3.field, label: e3.label || e3.field, format: e3.format }));
    const t2 = this.records[0];
    return (t2 ? Object.keys(t2) : []).map(((e3) => ({ field: e3, label: e3 })));
  }
  tableHTML(e2, t2, s2) {
    const i2 = "<thead><tr>" + e2.map(((e3) => `<th>${se.esc(e3.label)}</th>`)).join("") + "</tr></thead>", n2 = "<tbody>" + t2.map(((t3) => "<tr>" + e2.map(((e3) => {
      const s3 = t3[e3.field], i3 = e3.format ? e3.format(s3, t3) : s3;
      return `<td>${se.esc(i3)}</td>`;
    })).join("") + "</tr>")).join("") + "</tbody>";
    return `<table class="apexcharts-cf-table">${`<caption>${t2.length} of ${s2} rows</caption>`}${i2}${n2}</table>`;
  }
  dataTable(e2, t2) {
    if (!e2) return { refresh() {
    }, destroy() {
    } };
    const s2 = t2 || {}, i2 = this.resolveColumns(s2.columns), n2 = s2.pageSize || 0, r2 = s2.page || 0, a2 = () => {
      const t3 = this.filteredRows(), s3 = n2 ? t3.slice(r2 * n2, r2 * n2 + n2) : t3;
      e2.innerHTML = this.tableHTML(i2, s3, t3.length);
    };
    a2();
    const l2 = this.on("change", a2);
    return { refresh: a2, destroy: () => {
      l2(), e2.innerHTML = "";
    } };
  }
  destroy() {
    se.store().delete(this.id), this.dims.clear(), this.listeners.clear(), this.records = [];
  }
}
const PRICING_URL = "https://apexcharts.com/pricing";
let _perspectivesTokenDecoded = false;
const enforced = /* @__PURE__ */ new Set();
function markPerspectivesTokenDecoded() {
  _perspectivesTokenDecoded = true;
  reevaluateLicenseAcrossCharts();
}
function premiumFeaturesInUse(w, ctx) {
  const chart = w && w.config && w.config.chart || {};
  const used = [];
  if (chart.type === "unit") used.push("unit");
  if (ctx.storyboard && ctx.storyboard._used) used.push("storyboard");
  const link = chart.link;
  if (ctx.linkedViews && link && (link.enabled === true || typeof link.dimension === "function")) {
    used.push("link");
  }
  if (ctx.ink && chart.ink && chart.ink.enabled === true) used.push("ink");
  if (ctx.measure && chart.measure && chart.measure.enabled === true) {
    used.push("measure");
  }
  if (ctx.contextMenu && chart.contextMenu && chart.contextMenu.enabled === true) {
    used.push("context-menu");
  }
  if (ctx.perspectives && (ctx.perspectives._used || _perspectivesTokenDecoded)) {
    used.push("perspectives");
  }
  if (ctx.history && chart.history && chart.history.enabled === true) {
    used.push("history");
  }
  return used;
}
function resolveKey(w) {
  const perChart = w && w.config && w.config.chart && w.config.chart.license;
  if (perChart) return perChart;
  const singleton = o.getKey();
  if (singleton) return singleton;
  const apex = Environment.getApex();
  if (apex && apex.license) return apex.license;
  return null;
}
const PREMIUM_PLANS = /* @__PURE__ */ new Set(["premium", "enterprise"]);
function licensedForPremium(key) {
  if (!key) return false;
  const result = o.validateKey(key);
  if (!result.valid) return false;
  const plan = result.data && result.data.plan;
  return typeof plan === "string" && PREMIUM_PLANS.has(plan.toLowerCase());
}
function reinstateWatermark(ctx, elWrap) {
  const node = h.add(elWrap, { manage: false });
  if (!node || typeof MutationObserver === "undefined") return;
  if (ctx._wmNodeObserver && ctx._wmObservedNode === node) return;
  if (ctx._wmNodeObserver) ctx._wmNodeObserver.disconnect();
  const nodeObs = new MutationObserver(() => {
    const n2 = h.node(elWrap);
    if (!n2) return;
    nodeObs.disconnect();
    h.applyStyles(n2);
    nodeObs.takeRecords();
    nodeObs.observe(n2, { attributes: true, attributeFilter: ["style"] });
  });
  nodeObs.observe(node, { attributes: true, attributeFilter: ["style"] });
  ctx._wmNodeObserver = nodeObs;
  ctx._wmObservedNode = node;
}
function addWatermark(ctx, elWrap) {
  reinstateWatermark(ctx, elWrap);
  if (typeof MutationObserver === "undefined" || ctx._wmWrapObserver) return;
  const wrapObs = new MutationObserver(() => {
    if (!h.node(elWrap)) reinstateWatermark(ctx, elWrap);
  });
  wrapObs.observe(elWrap, { childList: true });
  ctx._wmWrapObserver = wrapObs;
}
function teardownWatermark(ctx, elWrap) {
  if (ctx._wmWrapObserver) {
    ctx._wmWrapObserver.disconnect();
    ctx._wmWrapObserver = null;
  }
  if (ctx._wmNodeObserver) {
    ctx._wmNodeObserver.disconnect();
    ctx._wmNodeObserver = null;
  }
  ctx._wmObservedNode = null;
  const wrap = elWrap || ctx.w && ctx.w.dom && ctx.w.dom.elWrap;
  if (wrap) h.remove(wrap, { manage: false });
}
function notifyTrial(ctx, key, features) {
  if (ctx._premiumLicenseNotified) return;
  ctx._premiumLicenseNotified = true;
  const many = features.length > 1;
  if (!key) {
    console.warn(
      `[ApexCharts] Premium feature${many ? "s" : ""} in use (${features.join(", ")}) without a license. Running in trial mode with a watermark. Get a license: ${PRICING_URL}`
    );
    return;
  }
  const result = o.validateKey(key);
  if (result.valid) {
    const plan = result.data && result.data.plan || "current";
    console.warn(
      `[ApexCharts] Premium feature${many ? "s" : ""} in use (${features.join(", ")}) require a Premium or Enterprise license; the ${plan} plan does not include ${many ? "them" : "it"}. Running in trial mode with a watermark. Upgrade: ${PRICING_URL}`
    );
    return;
  }
  if (key !== o.getKey()) {
    console.error(`[Apex] ${result.message}`);
  }
}
function enforceLicense(w, ctx) {
  try {
    if (!Environment.isBrowser()) return;
    if (w && w.globals && w.globals.isDestroyed) {
      enforced.delete(ctx);
      return;
    }
    const elWrap = w && w.dom && w.dom.elWrap;
    if (!elWrap) return;
    const features = premiumFeaturesInUse(w, ctx);
    if (features.length === 0) {
      enforced.delete(ctx);
      teardownWatermark(ctx, elWrap);
      return;
    }
    enforced.add(ctx);
    const key = resolveKey(w);
    if (licensedForPremium(key)) {
      teardownWatermark(ctx, elWrap);
      return;
    }
    addWatermark(ctx, elWrap);
    notifyTrial(ctx, key, features);
  } catch (e2) {
  }
}
function reevaluateLicenseAcrossCharts() {
  if (!Environment.isBrowser()) return;
  const visited = /* @__PURE__ */ new Set();
  const apex = Environment.getApex();
  const instances = apex && apex._chartInstances;
  if (Array.isArray(instances)) {
    instances.forEach((entry) => {
      const chart = entry && entry.chart;
      if (chart && chart.w && !chart.w.globals.isDestroyed) {
        visited.add(chart);
        enforceLicense(chart.w, chart);
      }
    });
  }
  Array.from(enforced).forEach((ctx) => {
    const w = ctx && ctx.w;
    const elWrap = w && w.dom && w.dom.elWrap;
    if (!w || w.globals.isDestroyed || !elWrap || elWrap.isConnected === false) {
      enforced.delete(ctx);
      return;
    }
    if (visited.has(ctx)) return;
    enforceLicense(w, ctx);
  });
}
o.onChange(reevaluateLicenseAcrossCharts);
const PERSPECTIVE_VERSION = 1;
const HASH_KEY = "apex";
function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i2 = 0; i2 < bytes.length; i2++) bin += String.fromCharCode(bytes[i2]);
  return btoa(bin);
}
function fromBase64(b64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i2 = 0; i2 < bin.length; i2++) bytes[i2] = bin.charCodeAt(i2);
  return new TextDecoder().decode(bytes);
}
function base64urlEncode(str) {
  return toBase64(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlDecode(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return fromBase64(b64);
}
function stripFunctions(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e2) {
    return void 0;
  }
}
class Perspectives {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._saved = [];
    this._counter = 0;
    this._used = false;
  }
  /**
   * Capture the current chart view as a Perspective token.
   * @returns {{ v: number, view: object, options?: Record<string, any> }}
   */
  capture() {
    const view = captureViewState(this.w, this.ctx);
    const token = (
      /** @type {any} */
      { v: PERSPECTIVE_VERSION, view }
    );
    const options = this._serializableDelta();
    if (options && Object.keys(options).length) token.options = options;
    return token;
  }
  /**
   * Build the whitelisted, function-free option override recorded in the token.
   * @returns {Record<string, any>}
   * @private
   */
  _serializableDelta() {
    const cfg = this.w.config;
    const whitelist = cfg.chart && cfg.chart.perspectives && cfg.chart.perspectives.serializeOptions || ["theme", "xaxis", "yaxis", "title", "subtitle"];
    const delta = {};
    whitelist.forEach((path) => {
      if (cfg[path] !== void 0) {
        const stripped = stripFunctions(cfg[path]);
        if (stripped !== void 0) delta[path] = stripped;
      }
    });
    return delta;
  }
  /**
   * Encode a token (or the current capture) to a compact base64url string.
   * JSON.stringify drops any functions embedded in annotation params / option
   * overrides by construction: a shared link carries data; the opening page
   * supplies its own functions from config.
   * @param {any} [token]
   * @returns {string}
   */
  encode(token) {
    const t2 = token || this.capture();
    return base64urlEncode(JSON.stringify(t2));
  }
  /**
   * Decode a base64url token string. Never throws: returns null on any error
   * or version mismatch (with a console warning).
   * @param {string} str
   * @returns {any | null}
   */
  decode(str) {
    return Perspectives.decode(str);
  }
  /**
   * Encode the current capture into a `#apex=<token>` URL hash fragment on the
   * current location. Browser-only; returns '' under SSR.
   * @returns {string}
   */
  toURL() {
    if (!Environment.isBrowser()) return "";
    const encoded = this.encode(this.capture());
    const url = new URL(window.location.href);
    url.hash = `${HASH_KEY}=${encoded}`;
    return url.toString();
  }
  /**
   * Restore a perspective. Accepts a token object or an encoded string. When
   * the chart is grouped, applies to every synced chart.
   *
   * The token's option overrides and `opts.mergeOptions` are folded into the
   * view restore's ONE updateOptions call (mergeOptions wins over
   * token.options; the view's own fields win over both). A single render is
   * deliberate: a second immediate updateOptions would kill the first one's
   * animation mid-flight, and a chart.type change applied this way morphs
   * (morph feature) inside the same re-render instead of being re-rendered
   * over. Consumed by Storyboard for per-beat option payloads.
   *
   * @param {any} tokenOrString
   * @param {{ animate?: boolean, mergeOptions?: Record<string, any> }} [opts]
   */
  apply(tokenOrString, opts = {}) {
    const token = typeof tokenOrString === "string" ? Perspectives.decode(tokenOrString) : tokenOrString;
    if (!token || !token.view) return;
    this._used = true;
    enforceLicense(this.w, this.ctx);
    const animate = opts.animate !== void 0 ? opts.animate : true;
    const combined = Utils.extend(
      token.options ? Utils.clone(token.options) : {},
      opts.mergeOptions || {}
    );
    const mergeOptions = Object.keys(combined).length ? combined : void 0;
    const targets = this.w.config.chart.group ? this.ctx.getSyncedCharts() : [this.ctx];
    targets.forEach((chart) => {
      applyViewState(chart, token.view, { animate, mergeOptions });
    });
  }
  /**
   * Save the current view under a name in the in-memory registry.
   * @param {string} name
   * @returns {string} generated id
   */
  save(name) {
    const id = `perspective-${++this._counter}`;
    this._saved.push({ id, name: name || id, token: this.capture() });
    this._used = true;
    enforceLicense(this.w, this.ctx);
    return id;
  }
  /**
   * List saved perspectives.
   * @returns {{ id: string, name: string, token: any }[]}
   */
  list() {
    return this._saved.map((s2) => ({ id: s2.id, name: s2.name, token: s2.token }));
  }
  /**
   * Delete a saved perspective by id.
   * @param {string} id
   */
  delete(id) {
    const i2 = this._saved.findIndex((s2) => s2.id === id);
    if (i2 > -1) this._saved.splice(i2, 1);
  }
  /** Drop the saved-views registry (called on full destroy). */
  teardown() {
    this._saved = [];
    this._counter = 0;
  }
  // ── static, pure helpers (available once the feature is imported) ─────────
  /**
   * @param {string} str base64url token
   * @returns {any | null}
   */
  static decode(str) {
    if (typeof str !== "string" || !str) return null;
    try {
      const token = JSON.parse(base64urlDecode(str));
      if (!token || typeof token !== "object") return null;
      if (token.v !== PERSPECTIVE_VERSION) {
        console.warn(
          `apexcharts: unsupported perspective version ${token.v} (expected ${PERSPECTIVE_VERSION}).`
        );
        return null;
      }
      return token;
    } catch (e2) {
      console.warn("apexcharts: failed to decode perspective token.", e2);
      return null;
    }
  }
  /**
   * Parse a `#apex=<token>` fragment out of an href (or the current location in
   * a browser). Pure and Node-safe when given an explicit href.
   * @param {string} [href]
   * @returns {any | null}
   */
  static fromURL(href) {
    try {
      const target = href || (Environment.isBrowser() ? window.location.href : "");
      if (!target) return null;
      const url = new URL(target);
      const hash = url.hash.replace(/^#/, "");
      if (!hash) return null;
      const pair = hash.split("&").map((p) => p.split("=")).find((p) => p[0] === HASH_KEY);
      if (!pair || pair[1] == null) return null;
      return Perspectives.decode(decodeURIComponent(pair[1]));
    } catch (e2) {
      return null;
    }
  }
}
ApexCharts__default.registerFeatures({ perspectives: Perspectives });
ApexCharts__default.perspectives = {
  /** @param {string} str */
  decode: (str) => {
    markPerspectivesTokenDecoded();
    return Perspectives.decode(str);
  },
  /** @param {string} [href] */
  fromURL: (href) => {
    markPerspectivesTokenDecoded();
    return Perspectives.fromURL(href);
  }
};
class Storyboard {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._beats = [];
    this._observer = null;
    this._activeIndex = -1;
    this._animate = true;
    this._warnedNoPerspectives = false;
    this._used = false;
  }
  /**
   * Bind beats to scroll position. Rebinding replaces the previous binding.
   * @param {{
   *   beats?: Array<{ el?: Element, selector?: string, key?: string, view?: any, announce?: string, onEnter?: (chart: any, info: StoryboardBeatInfo) => void }>,
   *   scroller?: Element | string,
   *   offset?: number,
   *   animate?: boolean,
   * }} [opts]
   * @returns {number} the number of beats bound
   */
  bind(opts = {}) {
    var _a;
    this.unbind();
    if (!Environment.isBrowser()) return 0;
    const doc = this.ctx.el && this.ctx.el.ownerDocument;
    if (!doc || typeof IntersectionObserver === "undefined") return 0;
    let root = null;
    if (opts.scroller) {
      root = typeof opts.scroller === "string" ? doc.querySelector(opts.scroller) : opts.scroller;
    }
    this._beats = this._resolveBeats(doc, root, opts.beats);
    if (!this._beats.length) return 0;
    this._animate = opts.animate !== false;
    const offset = Math.min(Math.max((_a = opts.offset) != null ? _a : 0.5, 0), 1);
    const top = +(offset * 100).toFixed(3);
    const bottom = +(100 - offset * 100).toFixed(3);
    this._observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      { root, rootMargin: `-${top}% 0px -${bottom}%`, threshold: 0 }
    );
    this._beats.forEach((b) => {
      var _a2;
      return (_a2 = this._observer) == null ? void 0 : _a2.observe(b.el);
    });
    this._used = true;
    enforceLicense(this.w, this.ctx);
    return this._beats.length;
  }
  /**
   * Normalize the beats option, or auto-discover [data-apex-beat] elements in
   * document order when no explicit list is given.
   * @param {Document} doc
   * @param {Element | null} root
   * @param {Array<any>} [beatsOpt]
   * @returns {StoryboardBeat[]}
   * @private
   */
  _resolveBeats(doc, root, beatsOpt) {
    const beats = [];
    if (Array.isArray(beatsOpt)) {
      beatsOpt.forEach((b, i2) => {
        var _a, _b;
        if (!b) return;
        const el = b.el && typeof b.el === "object" ? b.el : b.selector ? doc.querySelector(b.selector) : null;
        if (!el) {
          console.warn(
            `apexcharts: storyboard beat ${i2} has no resolvable element; skipped.`
          );
          return;
        }
        beats.push({
          el,
          key: (_b = (_a = b.key) != null ? _a : el.getAttribute("data-apex-beat")) != null ? _b : String(i2),
          view: b.view,
          options: b.options,
          announce: b.announce,
          onEnter: typeof b.onEnter === "function" ? b.onEnter : void 0
        });
      });
      return beats;
    }
    const scope = root || doc;
    scope.querySelectorAll("[data-apex-beat]").forEach((el, i2) => {
      beats.push({
        el,
        key: el.getAttribute("data-apex-beat") || String(i2),
        view: el.getAttribute("data-apex-view") || void 0,
        options: void 0,
        announce: el.getAttribute("data-apex-announce") || void 0,
        onEnter: void 0
      });
    });
    return beats;
  }
  /**
   * @param {IntersectionObserverEntry[]} entries
   * @private
   */
  _onIntersect(entries) {
    entries.forEach((entry) => {
      const idx = this._beats.findIndex((b) => b.el === entry.target);
      if (idx < 0) return;
      if (entry.isIntersecting) {
        this._activate(idx);
      } else if (idx === this._activeIndex && entry.rootBounds) {
        if (entry.boundingClientRect.top >= entry.rootBounds.bottom && idx > 0) {
          this._activate(idx - 1);
        }
      }
    });
  }
  /**
   * Activate a beat: apply its view token, run its callback, announce it and
   * fire `beatChange`. Idempotent per beat (re-activating the current beat is
   * a no-op), so IO chatter never re-applies a view.
   * @param {number} idx
   * @param {{ animate?: boolean }} [opts]
   * @private
   */
  _activate(idx, opts = {}) {
    var _a, _b;
    if (idx === this._activeIndex) return;
    const beat = this._beats[idx];
    if (!beat) return;
    const direction = idx > this._activeIndex ? "down" : "up";
    this._activeIndex = idx;
    const animate = (opts.animate !== void 0 ? opts.animate : this._animate) && !prefersReducedMotion();
    if (beat.view != null || beat.options) {
      if (this.ctx.perspectives) {
        const v = (_a = beat.view) != null ? _a : {};
        const token = typeof v === "string" || v.view ? v : { view: this._normalizeView(v) };
        this.ctx.perspectives.apply(token, {
          animate,
          mergeOptions: beat.options
        });
      } else if (!this._warnedNoPerspectives) {
        this._warnedNoPerspectives = true;
        console.warn(
          'apexcharts: storyboard beats carry views but the perspectives feature is not bundled. import "apexcharts/features/storyboard" (which includes it) or drive beats via onEnter.'
        );
      }
    }
    const info = { index: idx, key: beat.key, el: beat.el, direction };
    if (beat.onEnter) beat.onEnter(this.ctx, info);
    if (beat.announce) this._announce(beat.announce);
    if (typeof this.w.config.chart.events.beatChange === "function") {
      this.w.config.chart.events.beatChange(this.ctx, info);
    }
    (_b = this.ctx.events) == null ? void 0 : _b.fireEvent("beatChange", [this.ctx, info]);
  }
  /**
   * Fill in the parts of a hand-authored (bare) ViewState that would
   * otherwise LEAK between beats. updateOptions merges objects, so a beat
   * listing only xaxis annotations would keep a previous beat's point
   * annotations; padding every annotation kind with an empty array makes
   * each beat fully describe its own state, which is what allows scrubbing
   * in both directions. Full tokens (from capture()/encode()) already carry
   * the complete set and never pass through here.
   * @param {any} view
   * @returns {any}
   * @private
   */
  _normalizeView(view) {
    const provided = view.annotations && view.annotations.static || {};
    return __spreadProps(__spreadValues({}, view), {
      annotations: {
        static: __spreadValues({
          points: [],
          xaxis: [],
          yaxis: [],
          texts: [],
          images: []
        }, provided),
        dynamic: view.annotations && view.annotations.dynamic || []
      }
    });
  }
  /**
   * Programmatically jump to a beat by index or author key (also usable
   * without scrolling, e.g. from next/prev buttons).
   * @param {number | string} indexOrKey
   * @param {{ animate?: boolean }} [opts]
   */
  goTo(indexOrKey, opts = {}) {
    const idx = typeof indexOrKey === "number" ? indexOrKey : this._beats.findIndex((b) => b.key === indexOrKey);
    if (idx >= 0 && idx < this._beats.length) this._activate(idx, opts);
  }
  /**
   * @returns {{ index: number, key: string | null } | null} the active beat
   */
  current() {
    if (this._activeIndex < 0) return null;
    const beat = this._beats[this._activeIndex];
    return { index: this._activeIndex, key: beat ? beat.key : null };
  }
  /** Disconnect the observer and drop the beat list. */
  unbind() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    this._beats = [];
    this._activeIndex = -1;
    this._used = false;
    enforceLicense(this.w, this.ctx);
  }
  /** Full-destroy cleanup (called from Destroy). */
  teardown() {
    this.unbind();
  }
  /**
   * Push a beat's announcement to the chart's visually-hidden aria-live
   * status region so screen-reader users follow the story too. No-op when
   * announcements are disabled or the region is absent.
   * @param {string} message
   * @private
   */
  _announce(message) {
    const w = this.w;
    if (!w.config.chart.accessibility.announcements.enabled) return;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const region = baseEl.querySelector(".apexcharts-sr-status");
    if (!region) return;
    region.textContent = "";
    setTimeout(() => {
      region.textContent = message;
    }, 0);
  }
}
ApexCharts__default.registerFeatures({ storyboard: Storyboard });
function isEditableTarget(node) {
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable === true;
}
class History {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.stack = [];
    this.pointer = -1;
    this.applying = false;
    this._batching = false;
    this._counter = 0;
    this._coalesceTimer = null;
    this._settleTimer = null;
    this._pendingLabel = void 0;
    this._keydownTarget = null;
    this._pointerTarget = null;
    this._engaged = false;
    this._wired = false;
    this._readConfig();
    this._onMounted = this._onMounted.bind(this);
    this._onUpdated = this._onUpdated.bind(this);
    this._onSelection = this._onSelection.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this.init();
  }
  /**
   * (Re)read chart.history config. Called at construction and again on every
   * mounted/updated event so `updateOptions({ chart: { history: {...} } })`
   * takes effect at runtime: enabling wires the keyboard + starts capturing,
   * disabling stops capturing (the stack is kept for a later re-enable).
   */
  _readConfig() {
    const w = this.w;
    const cfg = w.config.chart && w.config.chart.history || {};
    this.enabled = !!cfg.enabled;
    this.maxDepth = cfg.maxDepth > 0 ? cfg.maxDepth : 100;
    this.coalesceMs = cfg.coalesceMs != null ? cfg.coalesceMs : 250;
    this.keyboard = cfg.keyboard !== false;
  }
  /** Re-sync config, then wire/unwire the keyboard to match. */
  _syncConfig() {
    this._readConfig();
    if (this.enabled && this.keyboard) this._wireKeyboard();
    else this._unwireKeyboard();
  }
  init() {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("mounted", this._onMounted);
    this.ctx.addEventListener("updated", this._onUpdated);
    this.ctx.addEventListener("scrolled", this._onUpdated);
    this.ctx.addEventListener("dataPointSelection", this._onSelection);
    if (this.enabled && this.keyboard) this._wireKeyboard();
  }
  /**
   * Keyboard: Cmd/Ctrl+Z = undo, Shift+Cmd/Ctrl+Z or Ctrl+Y = redo. Bound on
   * the document (not the chart element) because pointer gestures that create
   * an undo step (annotation drag, zoom, pan) call preventDefault and so never
   * move focus into the chart, leaving an el-scoped listener unreachable. To
   * stay non-intrusive it acts only when this chart is "engaged" (see
   * _onKeyDown): a capture-phase pointerdown marks engagement so the shortcut
   * follows the chart the user last touched, and defers to text editing.
   */
  _wireKeyboard() {
    if (this._keydownTarget) return;
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    const doc = el && el.ownerDocument;
    if (!Environment.isBrowser() || !doc) return;
    doc.addEventListener("keydown", this._onKeyDown);
    doc.addEventListener("pointerdown", this._onPointerDown, true);
    doc.addEventListener("mousedown", this._onPointerDown, true);
    this._keydownTarget = doc;
    this._pointerTarget = doc;
  }
  _unwireKeyboard() {
    if (this._keydownTarget) {
      this._keydownTarget.removeEventListener("keydown", this._onKeyDown);
      this._keydownTarget = null;
    }
    if (this._pointerTarget) {
      this._pointerTarget.removeEventListener("pointerdown", this._onPointerDown, true);
      this._pointerTarget.removeEventListener("mousedown", this._onPointerDown, true);
      this._pointerTarget = null;
    }
    this._engaged = false;
  }
  // ─── Event handlers ─────────────────────────────────────────────────────
  _onMounted() {
    this._syncConfig();
    if (!this.enabled) return;
    if (this.stack.length === 0) this._commit("initial", true);
  }
  _onUpdated() {
    this._syncConfig();
    if (!this.enabled) return;
    if (this.applying) {
      this._refreshSettle();
      return;
    }
    this._schedule("update");
  }
  _onSelection() {
    if (!this.enabled || this.applying) return;
    this._schedule("selection");
  }
  /**
   * Mark whether the chart is engaged: a capture-phase pointerdown inside `el`
   * engages it (runs before feature handlers stopPropagation), one elsewhere
   * releases it. Capture phase so an annotation/zoom gesture that stops
   * propagation still registers.
   * @param {any} e
   */
  _onPointerDown(e2) {
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    this._engaged = !!(el && e2.target && el.contains(e2.target));
  }
  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e2) {
    if (!(e2.metaKey || e2.ctrlKey)) return;
    const key = (e2.key || "").toLowerCase();
    if (key !== "z" && key !== "y") return;
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    if (!el) return;
    const doc = el.ownerDocument;
    const active = doc && doc.activeElement;
    if (isEditableTarget(active)) return;
    if (!(el.contains(active) || this._engaged)) return;
    const redo = key === "y" || e2.shiftKey;
    e2.preventDefault();
    if (redo) this.redo();
    else this.undo();
  }
  // ─── Capture (coalesced) ────────────────────────────────────────────────
  /**
   * @param {string} label
   */
  _schedule(label) {
    if (this.applying || this._batching || !this.enabled) return;
    this._pendingLabel = label;
    if (this.coalesceMs > 0 && Environment.isBrowser()) {
      clearTimeout(this._coalesceTimer);
      this._coalesceTimer = setTimeout(
        () => this._commit(this._pendingLabel),
        this.coalesceMs
      );
    } else {
      this._commit(label);
    }
  }
  /**
   * @param {string} [label]
   * @param {boolean} [force] bypass the applying/batching guard (baseline / transaction)
   */
  _commit(label, force) {
    clearTimeout(this._coalesceTimer);
    this._coalesceTimer = null;
    if (!force && (this.applying || this._batching)) return;
    const cp = this._capture(label);
    const current = this.stack[this.pointer];
    if (current && current.sig === cp.sig) return;
    if (this.pointer < this.stack.length - 1) {
      this.stack.splice(this.pointer + 1);
    }
    this.stack.push(cp);
    this.pointer = this.stack.length - 1;
    while (this.stack.length > this.maxDepth) {
      this.stack.shift();
      this.pointer--;
    }
    this._emitChange();
  }
  /**
   * @param {string} [label]
   */
  _capture(label) {
    const view = captureViewState(this.w, this.ctx);
    const { config, seriesSig } = this._cloneConfigCOW();
    return {
      id: `hist-${++this._counter}`,
      view,
      config,
      seriesSig,
      label: label || "change",
      at: Environment.isBrowser() ? Date.now() : 0,
      origin: "local",
      // reserved for per-user scoping (Live Rooms)
      sig: this._signature(view, config)
    };
  }
  /**
   * Clone w.config, sharing the previous checkpoint's cloned series when the
   * live series CONTENT is unchanged (copy-on-write). Sharing is decided by a
   * value signature, not reference identity: callers commonly mutate a kept
   * series array in place and pass the same reference back to updateSeries, and
   * an identity check would share a stale clone for exactly that case. The
   * stringify is not extra cost: _signature already serialises the series as
   * part of dedup.
   * @returns {{ config: any, seriesSig: string|null }}
   */
  _cloneConfigCOW() {
    const w = this.w;
    const prev = this.stack[this.pointer];
    let seriesSig = null;
    try {
      seriesSig = JSON.stringify(w.config.series);
    } catch (e2) {
      seriesSig = null;
    }
    let cloned;
    if (prev && seriesSig !== null && prev.seriesSig === seriesSig) {
      const _a = w.config, { series: _series } = _a, rest = __objRest(_a, ["series"]);
      cloned = Utils.clone(rest);
      cloned.series = prev.config.series;
    } else {
      cloned = Utils.clone(w.config);
    }
    return { config: cloned, seriesSig };
  }
  /**
   * Data-level signature for dedup. Functions are dropped by JSON (fine: a
   * checkpoint whose only change is a function reference is not a meaningful
   * undo step). Runs once per committed checkpoint, not per raw event.
   * @param {any} view
   * @param {any} config
   * @returns {string}
   */
  _signature(view, config) {
    try {
      return JSON.stringify(view) + "|" + JSON.stringify(config);
    } catch (e2) {
      return `nosig-${this._counter}`;
    }
  }
  // ─── Restore ────────────────────────────────────────────────────────────
  /**
   * @param {any} cp
   * @param {boolean} animate
   */
  _restore(cp, animate) {
    if (!cp) return;
    this.applying = true;
    let p;
    try {
      this.ctx.clearAnnotations();
      p = this.ctx.updateOptions(Utils.clone(cp.config), false, animate, false, false);
    } catch (e2) {
      this.applying = false;
      throw e2;
    }
    Promise.resolve(p).then(() => {
      if (this.w.globals.isDestroyed) {
        this.applying = false;
        return;
      }
      applyViewInteraction(this.ctx, cp.view);
      this._refreshSettle();
      this._emitChange();
    }).catch(() => {
      this.applying = false;
    });
  }
  /**
   * Hold `applying` true until the restore's burst of async 'updated' events
   * has drained (one macrotask after the last one). Refreshed by _onUpdated.
   */
  _refreshSettle() {
    if (!Environment.isBrowser()) {
      this.applying = false;
      return;
    }
    clearTimeout(this._settleTimer);
    this._settleTimer = setTimeout(() => {
      this.applying = false;
    }, 0);
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /**
   * Commit a checkpoint of the current state now (a discrete undo step). Used by
   * callers that mutate `w.config` without going through a full re-render (e.g.
   * Ink Layer's targeted annotation redraws, which fire no 'updated' event).
   * No-op when disabled or while a restore is applying.
   * @param {string} [label]
   */
  snapshot(label) {
    if (!this.enabled || this.applying) return;
    this._commit(label || "change");
  }
  /**
   * @param {boolean} [animate]
   */
  undo(animate = true) {
    if (!this.canUndo()) return;
    this.pointer--;
    this._restore(this.stack[this.pointer], animate);
  }
  /**
   * @param {boolean} [animate]
   */
  redo(animate = true) {
    if (!this.canRedo()) return;
    this.pointer++;
    this._restore(this.stack[this.pointer], animate);
  }
  canUndo() {
    return this.pointer > 0;
  }
  canRedo() {
    return this.pointer > -1 && this.pointer < this.stack.length - 1;
  }
  /**
   * @param {string} id
   * @param {boolean} [animate]
   */
  jump(id, animate = true) {
    const idx = this.stack.findIndex((c2) => c2.id === id);
    if (idx === -1 || idx === this.pointer) return;
    this.pointer = idx;
    this._restore(this.stack[idx], animate);
  }
  /** Clear the history, keeping the current state as the new baseline. */
  clear() {
    clearTimeout(this._coalesceTimer);
    this._coalesceTimer = null;
    const current = this.stack[this.pointer];
    this.stack = current ? [current] : [];
    this.pointer = this.stack.length - 1;
    this._emitChange();
  }
  /**
   * Group multiple edits into a single undo step. `fn` may be async; await your
   * updateOptions/updateSeries calls inside it so the intermediate 'updated'
   * events are suppressed and only one checkpoint is committed afterwards.
   * @param {() => (void | Promise<any>)} fn
   * @param {{ label?: string }} [opts]
   * @returns {Promise<void>}
   */
  transaction(fn, opts = {}) {
    if (typeof fn !== "function") return Promise.resolve();
    const wasBatching = this._batching;
    this._batching = true;
    return Promise.resolve().then(() => fn()).finally(() => {
      this._batching = wasBatching;
      if (!wasBatching) this._commit(opts.label || "transaction", true);
    });
  }
  /**
   * @returns {{ id: string, label: string, at: number }[]}
   */
  entries() {
    return this.stack.map((c2) => ({ id: c2.id, label: c2.label, at: c2.at }));
  }
  /** Lightweight state for the historyChange event / a history-rail UI. */
  state() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      index: this.pointer,
      length: this.stack.length
    };
  }
  _emitChange() {
    this.ctx.events.fireEvent("historyChange", [this.ctx, this.state()]);
  }
  /** Drop the stack + detach listeners (called on full destroy). */
  teardown() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    clearTimeout(this._coalesceTimer);
    clearTimeout(this._settleTimer);
    this._coalesceTimer = null;
    this._settleTimer = null;
    this._unwireKeyboard();
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "mounted", this._onMounted);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "updated", this._onUpdated);
      (_f = (_e = this.ctx).removeEventListener) == null ? void 0 : _f.call(_e, "scrolled", this._onUpdated);
      (_h = (_g = this.ctx).removeEventListener) == null ? void 0 : _h.call(_g, "dataPointSelection", this._onSelection);
    }
    this.stack = [];
    this.pointer = -1;
    this._wired = false;
  }
}
ApexCharts__default.registerFeatures({ history: History });
const REGISTRY_KEY = "__apexcharts_plugins__";
function getRegistry() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = {};
  return g[REGISTRY_KEY];
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
  PLUGIN_CHART_METHODS.forEach((m) => {
    if (typeof ctx[m] === "function") out[m] = ctx[m].bind(ctx);
  });
  return Object.freeze(out);
}
function makeLayerHandle(g, graphics) {
  const add = (el) => {
    if (el) g.add(el);
    return el;
  };
  const handle = {
    get node() {
      return g.node;
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
        w = 0,
        h: h2 = 0,
        r: r2 = 0,
        fill = "#000",
        stroke = null,
        opacity = 1
      } = opts;
      return add(
        graphics.drawRect(
          x,
          y,
          w,
          h2,
          r2,
          fill,
          opacity,
          stroke != null ? 1 : null,
          stroke
        )
      );
    },
    /** @param {any} opts */
    circle(opts = {}) {
      const { cx = 0, cy = 0, r: r2 = 0, fill = "#000", stroke = null } = opts;
      return add(
        graphics.drawCircle(r2, { cx, cy, fill, stroke: stroke || "none" })
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
      const node = g.node;
      while (node.firstChild) node.removeChild(node.firstChild);
      return handle;
    }
  };
  return handle;
}
function buildPluginAPI(host, record) {
  const ctx = host.ctx;
  const w = host.w;
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
      const m = record.handlers;
      if (!m.has(hook)) m.set(hook, []);
      m.get(hook).push(fn);
      return api;
    },
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    off(hook, fn) {
      const a2 = record.handlers.get(hook);
      if (a2) {
        const i2 = a2.indexOf(fn);
        if (i2 > -1) a2.splice(i2, 1);
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
        return w.config.theme.mode;
      },
      get foreColor() {
        return w.config.chart.foreColor;
      },
      /** @param {number} i */
      seriesColor(i2) {
        return w.globals.colors[i2];
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
      return w.dom.baseEl;
    }
  };
  return Object.freeze(api);
}
class WeaveHost {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
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
    list.map((entry, i2) => ({
      entry,
      order: entry.order != null ? entry.order : i2
    })).sort((a2, b) => a2.order - b.order).forEach((o2) => this._activate(o2.entry));
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
    const v = def.apiVersion != null ? def.apiVersion : 1;
    if (Math.trunc(v) !== WEAVE_API_VERSION) {
      console.error(
        `[apexcharts] plugin "${def.name}" targets Weave API v${v}, host is v${WEAVE_API_VERSION}; skipped.`
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
    } catch (e2) {
      console.error(
        `[apexcharts] plugin "${record.def.name}" threw in "${where}":`,
        e2
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
    const w = this.w;
    const gl = w.globals;
    const L = w.layout;
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
      x: (v) => L.translateX + (v - gl.minX) / xRatio,
      /**
       * @param {number} v
       * @param {number} [axis]
       */
      y: (v, axis = 0) => L.translateY + (maxY(axis) - v) / yr(axis),
      domainX: [gl.minX, gl.maxX],
      /** @param {number} [axis] */
      domainY: (axis = 0) => [minY(axis), maxY(axis)],
      gridWidth: L.gridWidth,
      gridHeight: L.gridHeight,
      ratios: xyRatios
    };
  }
  // ─── Read-only data snapshot ────────────────────────────────────────────
  /**
   * @returns {any[]} defensive per-series snapshot (never the live slice)
   */
  _dataSnapshot() {
    const w = this.w;
    const gl = w.globals;
    const series = w.seriesData.series || [];
    const seriesX = w.seriesData.seriesX || [];
    return series.map((sData, i2) => {
      const xs = seriesX[i2] || [];
      const points = (sData || []).map((y, j) => ({
        x: xs[j] != null ? xs[j] : j,
        y
      }));
      return {
        name: gl.seriesNames ? gl.seriesNames[i2] : void 0,
        hidden: (gl.collapsedSeriesIndices || []).includes(i2),
        color: gl.colors ? gl.colors[i2] : void 0,
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
    const w = this.w;
    const gl = w.globals;
    switch (name) {
      case "foreColor":
        return w.config.chart.foreColor;
      case "background":
        return w.config.chart.background;
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
    let g = this._layers.get(name);
    if (!g) {
      g = this.ctx.graphics.group({
        class: `apexcharts-plugin-${name} ${className}`.trim()
      });
      const parent = this.w.dom.elGraphical.node;
      if (z === "behind") parent.insertBefore(g.node, parent.firstChild);
      else parent.appendChild(g.node);
      g.node.setAttribute("aria-hidden", "true");
      this._layers.set(name, g);
    }
    return makeLayerHandle(g, this.ctx.graphics);
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
      Array.prototype.forEach.call(groups, (n2) => n2.remove());
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
      plugins.map((e2, i2) => [
        e2.name,
        { entry: e2, order: e2.order != null ? e2.order : i2 }
      ])
    );
    for (let i2 = this.active.length - 1; i2 >= 0; i2--) {
      const r2 = this.active[i2];
      const want = desired.get(r2.def.name);
      if (!want) {
        this._guard(r2, "destroy", () => r2.def.destroy && r2.def.destroy(r2.api));
        this.active.splice(i2, 1);
      } else {
        r2.options = Object.freeze(__spreadValues({}, want.entry.options || {}));
      }
    }
    const activeNames = new Set(this.active.map((r2) => r2.def.name));
    const toAdd = [];
    desired.forEach((v, name) => {
      if (!activeNames.has(name)) toAdd.push(v);
    });
    toAdd.sort((a2, b) => a2.order - b.order).forEach((v) => this._activate(v.entry));
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
ApexCharts__default.registerFeatures({ weave: WeaveHost });
const STYLE_KEYS = {
  fill: "fill",
  stroke: "stroke",
  "stroke-width": "strokeWidth",
  "stroke-dasharray": "strokeDash",
  "stroke-linecap": "lineCap",
  "fill-opacity": "fillOpacity",
  "stroke-opacity": "strokeOpacity",
  "fill-rule": "fillRule"
};
const NEVER = Symbol("never");
const SHAPE_ID = {
  circle: 0,
  square: 1,
  rect: 1,
  triangle: 2,
  diamond: 3,
  star: 4,
  sparkle: 5,
  cross: 6,
  plus: 7,
  line: 8
};
const SHAPE_NAME = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",
  "sparkle",
  "cross",
  "plus",
  "line"
];
const NOOP_RUNNER = {
  /** @returns {any} */
  attr() {
    return NOOP_RUNNER;
  },
  plot() {
    return NOOP_RUNNER;
  },
  during() {
    return NOOP_RUNNER;
  },
  after(fn) {
    if (typeof fn === "function") fn();
    return NOOP_RUNNER;
  },
  animate() {
    return NOOP_RUNNER;
  },
  delay() {
    return NOOP_RUNNER;
  },
  loop() {
    return NOOP_RUNNER;
  },
  finish() {
    return NOOP_RUNNER;
  },
  stop() {
    return NOOP_RUNNER;
  }
};
const SHARED_MARKER_NODE = {
  nodeName: "path",
  style: {},
  classList: { add() {
  }, remove() {
  }, toggle() {
  }, contains: () => false },
  setAttribute() {
  },
  getAttribute: () => null,
  removeAttribute() {
  },
  hasAttribute: () => false,
  addEventListener() {
  },
  removeEventListener() {
  },
  appendChild() {
  },
  getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 })
};
const SHARED_GROUP = {
  __isCanvasMark: true,
  node: {
    nodeName: "g",
    instance: null,
    style: {},
    classList: { add() {
    }, remove() {
    }, toggle() {
    }, contains: () => false },
    setAttribute() {
    },
    getAttribute: () => null,
    removeAttribute() {
    },
    addEventListener() {
    },
    removeEventListener() {
    },
    appendChild() {
    },
    getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 })
  },
  /** @returns {any} */
  attr() {
    return SHARED_GROUP;
  },
  add() {
    return SHARED_GROUP;
  },
  addTo() {
    return SHARED_GROUP;
  },
  remove() {
    return SHARED_GROUP;
  },
  clear() {
    return SHARED_GROUP;
  },
  css() {
    return SHARED_GROUP;
  },
  hide() {
    return SHARED_GROUP;
  },
  show() {
    return SHARED_GROUP;
  },
  removeClass() {
    return SHARED_GROUP;
  },
  animate() {
    return NOOP_RUNNER;
  }
};
class CanvasMarkerRef {
  /**
   * @param {CanvasGraphics} g
   * @param {number} i
   */
  constructor(g, i2) {
    this.__isCanvasMark = true;
    this._g = g;
    this._i = i2;
  }
  get node() {
    return SHARED_MARKER_NODE;
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a2, v) {
    if (typeof a2 === "string") {
      if (a2 === "fill" && v !== void 0) this._g._setMarkerFill(this._i, v);
      return v === void 0 ? null : this;
    }
    if (a2 && a2.fill !== void 0) this._g._setMarkerFill(this._i, a2.fill);
    return this;
  }
  /** @param {any} _c */
  add(_c) {
    return this;
  }
  /** @param {any} _p */
  addTo(_p) {
    return this;
  }
  remove() {
    return this;
  }
  /** @param {any} _s */
  css(_s) {
    return this;
  }
  /** @param {any} _v */
  fill(_v) {
    if (_v !== void 0) this._g._setMarkerFill(this._i, _v);
    return this;
  }
  /** @param {any} _v */
  stroke(_v) {
    return this;
  }
  hide() {
    return this;
  }
  show() {
    return this;
  }
  /** @param {string} _c */
  removeClass(_c) {
    return this;
  }
  animate() {
    return NOOP_RUNNER;
  }
}
const SHARED_RECT_REF = {
  __isCanvasMark: true,
  node: SHARED_MARKER_NODE,
  /** @returns {any} */
  attr() {
    return SHARED_RECT_REF;
  },
  add() {
    return SHARED_RECT_REF;
  },
  addTo() {
    return SHARED_RECT_REF;
  },
  remove() {
    return SHARED_RECT_REF;
  },
  /** @returns {any} */
  css() {
    return SHARED_RECT_REF;
  },
  animate() {
    return NOOP_RUNNER;
  }
};
class CanvasMark {
  /** @param {any} cmd */
  constructor(cmd) {
    this.__isCanvasMark = true;
    this._cmd = cmd;
    const self = this;
    this.node = {
      nodeName: cmd ? cmd.tag : "g",
      instance: this,
      style: {},
      classList: { add() {
      }, remove() {
      }, toggle() {
      }, contains: () => false },
      /** @param {string} k @param {any} v */
      setAttribute(k, v) {
        self._applyAttr(k, v);
      },
      getAttribute: () => null,
      removeAttribute() {
      },
      hasAttribute: () => false,
      addEventListener() {
      },
      removeEventListener() {
      },
      appendChild() {
      },
      getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 })
    };
  }
  /**
   * @param {string} k
   * @param {any} v
   */
  _applyAttr(k, v) {
    const cmd = this._cmd;
    if (!cmd) return;
    const sk = STYLE_KEYS[k];
    if (sk !== void 0) cmd[sk] = v;
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a2, v) {
    if (typeof a2 === "string") {
      if (v === void 0) return null;
      this._applyAttr(a2, v);
      return this;
    }
    for (const k in a2) {
      if (a2[k] !== void 0) this._applyAttr(k, a2[k]);
    }
    return this;
  }
  /** @param {any} _c */
  add(_c) {
    return this;
  }
  /** @param {any} _p */
  addTo(_p) {
    return this;
  }
  remove() {
    return this;
  }
  clear() {
    return this;
  }
  /** @param {any} _s */
  css(_s) {
    return this;
  }
  /** @param {any} v */
  fill(v) {
    if (typeof v === "object") return this.attr(v);
    return this.attr("fill", v);
  }
  /** @param {any} v */
  stroke(v) {
    if (typeof v === "object") {
      if (v.color !== void 0) this.attr("stroke", v.color);
      if (v.width !== void 0) this.attr("stroke-width", v.width);
      return this;
    }
    return this.attr("stroke", v);
  }
  /** @param {string} d */
  plot(d) {
    if (typeof d === "string" && this._cmd && this._cmd.tag === "path") {
      this._cmd.d = d;
    }
    return this;
  }
  hide() {
    return this;
  }
  show() {
    return this;
  }
  /** @param {string} _c */
  removeClass(_c) {
    return this;
  }
  bbox() {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  animate() {
    return NOOP_RUNNER;
  }
}
class CanvasGraphics {
  /** @param {any} w */
  constructor(w) {
    this.w = w;
    this._g = new Graphics(w);
    this._list = [];
    this._mx = new Float64Array(16);
    this._my = new Float64Array(16);
    this._msize = new Float64Array(16);
    this._mshape = new Int16Array(16);
    this._mstyle = new Int32Array(16);
    this._msi = new Int32Array(16);
    this._mn = 0;
    this._mcap = 16;
    this._crx = new Float64Array(16);
    this._cry = new Float64Array(16);
    this._crw = new Float64Array(16);
    this._crh = new Float64Array(16);
    this._crstyle = new Int32Array(16);
    this._crsi = new Int32Array(16);
    this._crdi = new Int32Array(16);
    this._crn = 0;
    this._crcap = 16;
    this._cellRadius = 0;
    this._styles = [];
    this._styleMap = /* @__PURE__ */ new Map();
    this._lf = NEVER;
    this._ls = NEVER;
    this._lsw = NEVER;
    this._ld = NEVER;
    this._lfo = NEVER;
    this._lso = NEVER;
    this._lid = -1;
    this._lofFill = NEVER;
    this._lofBase = -1;
    this._lofId = -1;
    this._rlf = NEVER;
    this._rls = NEVER;
    this._rlsw = NEVER;
    this._rlfo = NEVER;
    this._rlso = NEVER;
    this._rlid = -1;
  }
  _resetStyleCache() {
    this._lf = NEVER;
    this._ls = NEVER;
    this._lsw = NEVER;
    this._ld = NEVER;
    this._lfo = NEVER;
    this._lso = NEVER;
    this._lid = -1;
    this._lofFill = NEVER;
    this._lofBase = -1;
    this._lofId = -1;
    this._rlf = NEVER;
    this._rls = NEVER;
    this._rlsw = NEVER;
    this._rlfo = NEVER;
    this._rlso = NEVER;
    this._rlid = -1;
  }
  /** Start a fresh scene (columnar marker store + object-command list). */
  reset() {
    this._list = [];
    this._mn = 0;
    this._styles = [];
    this._styleMap = /* @__PURE__ */ new Map();
    this._resetStyleCache();
    const series = this.w.config.series || [];
    let cap = 16;
    for (let i2 = 0; i2 < series.length; i2++) {
      const d = series[i2] && series[i2].data;
      if (Array.isArray(d)) cap += d.length;
    }
    cap = Math.ceil(cap * 1.15) + 16;
    if (cap > this._mcap) this._allocMarkers(cap);
    this._crn = 0;
    this._cellRadius = 0;
    if (cap > this._crcap) this._allocRects(cap);
  }
  /** @param {number} cap */
  _allocRects(cap) {
    this._crcap = cap;
    this._crx = new Float64Array(cap);
    this._cry = new Float64Array(cap);
    this._crw = new Float64Array(cap);
    this._crh = new Float64Array(cap);
    this._crstyle = new Int32Array(cap);
    this._crsi = new Int32Array(cap);
    this._crdi = new Int32Array(cap);
  }
  /** Grow the rect columns (rare: capacity estimate was low). */
  _growRects() {
    const cap = this._crcap * 2;
    const nx = new Float64Array(cap);
    nx.set(this._crx);
    this._crx = nx;
    const ny = new Float64Array(cap);
    ny.set(this._cry);
    this._cry = ny;
    const nw = new Float64Array(cap);
    nw.set(this._crw);
    this._crw = nw;
    const nh = new Float64Array(cap);
    nh.set(this._crh);
    this._crh = nh;
    const nst = new Int32Array(cap);
    nst.set(this._crstyle);
    this._crstyle = nst;
    const nsi = new Int32Array(cap);
    nsi.set(this._crsi);
    this._crsi = nsi;
    const ndi = new Int32Array(cap);
    ndi.set(this._crdi);
    this._crdi = ndi;
    this._crcap = cap;
  }
  /** @param {number} cap */
  _allocMarkers(cap) {
    this._mcap = cap;
    this._mx = new Float64Array(cap);
    this._my = new Float64Array(cap);
    this._msize = new Float64Array(cap);
    this._mshape = new Int16Array(cap);
    this._mstyle = new Int32Array(cap);
    this._msi = new Int32Array(cap);
  }
  /** Grow the marker columns (rare: capacity estimate was low). */
  _growMarkers() {
    const cap = this._mcap * 2;
    const nx = new Float64Array(cap);
    nx.set(this._mx);
    this._mx = nx;
    const ny = new Float64Array(cap);
    ny.set(this._my);
    this._my = ny;
    const ns = new Float64Array(cap);
    ns.set(this._msize);
    this._msize = ns;
    const nsh = new Int16Array(cap);
    nsh.set(this._mshape);
    this._mshape = nsh;
    const nst = new Int32Array(cap);
    nst.set(this._mstyle);
    this._mstyle = nst;
    const nsi = new Int32Array(cap);
    nsi.set(this._msi);
    this._msi = nsi;
    this._mcap = cap;
  }
  displayList() {
    return this._list;
  }
  markerCount() {
    return this._mn;
  }
  /**
   * Intern a marker style; returns its palette id. Keeps the per-point columns
   * numeric (no retained per-point object).
   * @param {any} fill @param {any} stroke @param {any} sw @param {any} dash
   * @param {any} fo @param {any} so
   * @returns {number}
   */
  _internStyle(fill, stroke, sw, dash, fo, so) {
    const key = `${fill}|${stroke}|${sw}|${dash}|${fo}|${so}`;
    const cached = this._styleMap.get(key);
    if (cached !== void 0) return cached;
    const id = this._styles.length;
    this._styles.push({
      fill,
      stroke,
      strokeWidth: sw,
      strokeDash: dash,
      fillOpacity: fo,
      strokeOpacity: so
    });
    this._styleMap.set(key, id);
    return id;
  }
  /**
   * Override a recorded marker's fill (scatter sets a per-point fill via `attr`
   * right after drawMarker). Like the draw path, the string-key intern is cached
   * on (base style, fill) so the Map/string work stays OFF the per-point path
   * (it otherwise mixes with the `_mstyle[i]` typed-array write → the ~80× slow
   * path). For a scatter series the base + fill are uniform, so it interns once.
   * @param {number} i @param {any} fill
   */
  _setMarkerFill(i2, fill) {
    const base = this._mstyle[i2];
    if (fill === this._lofFill && base === this._lofBase) {
      this._mstyle[i2] = this._lofId;
      return;
    }
    const s2 = this._styles[base];
    if (!s2 || s2.fill === fill) {
      this._lofFill = fill;
      this._lofBase = base;
      this._lofId = base;
      return;
    }
    const id = this._internStyle(
      fill,
      s2.stroke,
      s2.strokeWidth,
      s2.strokeDash,
      s2.fillOpacity,
      s2.strokeOpacity
    );
    this._mstyle[i2] = id;
    this._lofFill = fill;
    this._lofBase = base;
    this._lofId = id;
  }
  /** @param {number} i @returns {any} the style object for a marker index */
  markerStyle(i2) {
    return this._styles[this._mstyle[i2]];
  }
  /** @param {number} i @returns {number} series (realIndex) of a marker, -1 if none */
  markerSeries(i2) {
    return this._msi[i2];
  }
  /** @param {number} id @returns {string} */
  shapeName(id) {
    return SHAPE_NAME[id] || "circle";
  }
  // ── columnar rect cell (heatmap): parallel unboxed arrays, no per-cell object ──
  /**
   * Record a heatmap-style cell (a filled, optionally stroked rect). Geometry
   * and style are captured up front into the columns; the returned handle is a
   * shared no-op (the emit site sets nothing back on it in canvas mode).
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {any} opts {fill, fillOpacity, stroke, strokeWidth, radius, seriesIndex, dataPointIndex}
   * @returns {any}
   */
  drawRectCell(x, y, w, h2, opts = {}) {
    const styleId = this._rectStyleId(opts);
    if (this._crn >= this._crcap) this._growRects();
    const i2 = this._crn++;
    this._crx[i2] = x || 0;
    this._cry[i2] = y || 0;
    this._crw[i2] = w > 0 ? w : 0;
    this._crh[i2] = h2 > 0 ? h2 : 0;
    this._crstyle[i2] = styleId;
    this._crsi[i2] = opts.seriesIndex == null ? -1 : opts.seriesIndex;
    this._crdi[i2] = opts.dataPointIndex == null ? -1 : opts.dataPointIndex;
    if (opts.radius) this._cellRadius = opts.radius;
    return SHARED_RECT_REF;
  }
  /**
   * Resolve (and dedupe) a rect-cell style → shared-palette id. A last-style
   * cache keeps the Map/string work off the path for runs of same-style cells.
   * @param {any} opts
   * @returns {number}
   */
  _rectStyleId(opts) {
    const fill = opts.fill;
    const stroke = opts.stroke;
    const sw = opts.strokeWidth;
    const fo = opts.fillOpacity;
    const so = opts.strokeOpacity;
    if (fill === this._rlf && stroke === this._rls && sw === this._rlsw && fo === this._rlfo && so === this._rlso) {
      return this._rlid;
    }
    const id = this._internStyle(fill, stroke, sw, 0, fo, so);
    this._rlf = fill;
    this._rls = stroke;
    this._rlsw = sw;
    this._rlfo = fo;
    this._rlso = so;
    this._rlid = id;
    return id;
  }
  /** @returns {number} number of recorded rect cells */
  rectCount() {
    return this._crn;
  }
  /** @param {number} i @returns {any} the style object for a rect cell */
  rectStyle(i2) {
    return this._styles[this._crstyle[i2]];
  }
  /** @param {number} i @returns {number} series (realIndex) of a cell, -1 if none */
  rectSeries(i2) {
    return this._crsi[i2];
  }
  /**
   * @param {string} tag
   * @param {number} z
   * @returns {any}
   */
  _cmd(tag, z) {
    const cmd = {
      tag,
      z: z || 0,
      fill: void 0,
      stroke: void 0,
      strokeWidth: void 0,
      strokeDash: void 0,
      lineCap: void 0,
      fillOpacity: void 0,
      strokeOpacity: void 0,
      fillRule: void 0
    };
    this._list.push(cmd);
    return cmd;
  }
  // ── organizational (groups don't paint or record) ──
  // Series draw() creates a wrap group PER POINT (scatter.draw / plotChartMarkers
  // run per point), so allocating a handle per group is ~50k heavy allocations
  // at scale: enough transient churn to tip V8 into a GC blow-up. Groups carry
  // no paint state in canvas mode (attr/add are no-ops), so every group shares
  // one singleton: zero per-point allocation.
  /** @param {any} _attrs */
  group(_attrs) {
    return SHARED_GROUP;
  }
  // ── per-point marker (line/area markers, scatter, bubble): COLUMNAR ──
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x, y, opts = {}) {
    var _a;
    const styleId = this._markerStyleId(opts);
    if (this._mn >= this._mcap) this._growMarkers();
    const i2 = this._mn++;
    this._mx[i2] = x || 0;
    this._my[i2] = typeof y === "number" ? y : NaN;
    this._msize[i2] = opts.pSize || 0;
    this._mshape[i2] = (_a = SHAPE_ID[opts.shape || "circle"]) != null ? _a : 0;
    this._mstyle[i2] = styleId;
    this._msi[i2] = opts.seriesIndex == null ? -1 : opts.seriesIndex;
    return new CanvasMarkerRef(this, i2);
  }
  /**
   * Resolve (and dedupe) a marker style → palette id. A last-style cache keeps
   * the Map/string work off the path when consecutive markers share a style
   * (the common case), so intern runs once per style run.
   * @param {any} opts
   * @returns {number}
   */
  _markerStyleId(opts) {
    const shape = opts.shape || "circle";
    const strokeTinted = shape === "line" || shape === "plus" || shape === "cross";
    const fill = strokeTinted ? "none" : opts.pointFillColor;
    const stroke = strokeTinted ? opts.pointFillColor : opts.pointStrokeColor;
    const sw = opts.pointStrokeWidth;
    const dash = opts.pointStrokeDashArray;
    const fo = opts.pointFillOpacity;
    const so = strokeTinted ? opts.pointFillOpacity : opts.pointStrokeOpacity;
    if (fill === this._lf && stroke === this._ls && sw === this._lsw && dash === this._ld && fo === this._lfo && so === this._lso) {
      return this._lid;
    }
    const id = this._internStyle(fill, stroke, sw, dash, fo, so);
    this._lf = fill;
    this._ls = stroke;
    this._lsw = sw;
    this._ld = dash;
    this._lfo = fo;
    this._lso = so;
    this._lid = id;
    return id;
  }
  // ── series body path (line/area/bar): object command ──
  /** @param {any} opts */
  renderPaths(opts) {
    const cmd = this._cmd("path", opts.realIndex);
    cmd.d = opts.pathTo;
    if (opts.pathToNumeric) {
      cmd.nxs = opts.pathToNumeric.xs;
      cmd.nys = opts.pathToNumeric.ys;
      cmd.ncloseY = opts.pathToNumeric.closeY;
    }
    cmd.stroke = opts.stroke;
    cmd.strokeWidth = opts.strokeWidth;
    cmd.fill = opts.fill;
    cmd.lineCap = opts.strokeLinecap;
    cmd.si = opts.realIndex;
    this.w.globals.animationEnded = true;
    return new CanvasMark(cmd);
  }
  /** @param {any} opts */
  drawPath(opts) {
    const cmd = this._cmd("path", 0);
    cmd.d = opts.d;
    cmd.stroke = opts.stroke;
    cmd.strokeWidth = opts.strokeWidth;
    cmd.fill = opts.fill;
    cmd.fillOpacity = opts.fillOpacity;
    cmd.strokeOpacity = opts.strokeOpacity;
    cmd.lineCap = opts.strokeLinecap;
    cmd.strokeDash = opts.strokeDashArray;
    return new CanvasMark(cmd);
  }
  // ── remaining primitives (contract completeness / Marks #11 forward-compat) ──
  /**
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {string} lineColor @param {any} dashArray @param {number} strokeWidth
   */
  drawLine(x1, y1, x2, y2, lineColor = "#a8a8a8", dashArray = 0, strokeWidth = 1) {
    const cmd = this._cmd("line", 0);
    cmd.lx1 = x1;
    cmd.ly1 = y1;
    cmd.lx2 = x2;
    cmd.ly2 = y2;
    cmd.stroke = lineColor;
    cmd.strokeDash = dashArray;
    cmd.strokeWidth = strokeWidth;
    return new CanvasMark(cmd);
  }
  /**
   * Mirrors Graphics.drawRect's full signature (including stroke), so callers
   * that stroke rects (Marks api.rect, chart code) paint the same on canvas.
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {number} radius @param {string} color @param {number} opacity
   * @param {number|null} [strokeWidth] @param {string|null} [strokeColor]
   * @param {any} [strokeDashArray]
   */
  drawRect(x1 = 0, y1 = 0, x2 = 0, y2 = 0, radius = 0, color = "#fefefe", opacity = 1, strokeWidth = null, strokeColor = null, strokeDashArray = 0) {
    const cmd = this._cmd("rect", 0);
    cmd.x1 = x1;
    cmd.y1 = y1;
    cmd.rw = x2 > 0 ? x2 : 0;
    cmd.rh = y2 > 0 ? y2 : 0;
    cmd.radius = radius;
    cmd.fill = color;
    cmd.fillOpacity = opacity;
    if (strokeColor != null) {
      cmd.stroke = strokeColor;
      cmd.strokeWidth = strokeWidth == null ? 1 : strokeWidth;
      cmd.strokeDash = strokeDashArray;
    }
    return new CanvasMark(cmd);
  }
  /**
   * @param {number} radius
   * @param {any} attrs
   */
  drawCircle(radius, attrs = null) {
    const cmd = this._cmd("circle", 0);
    cmd.r = radius < 0 ? 0 : radius;
    if (attrs) {
      cmd.cx = attrs.cx;
      cmd.cy = attrs.cy;
      if (attrs.fill !== void 0) cmd.fill = attrs.fill;
      if (attrs.stroke !== void 0) cmd.stroke = attrs.stroke;
    }
    return new CanvasMark(cmd);
  }
  /** @param {any} opts */
  drawText(opts) {
    const cmd = this._cmd("text", 0);
    cmd.text = Array.isArray(opts.text) ? opts.text.join(" ") : opts.text;
    cmd.tx = opts.x;
    cmd.ty = opts.y;
    cmd.textAnchor = opts.textAnchor || "start";
    cmd.fontSize = opts.fontSize;
    cmd.fontFamily = opts.fontFamily;
    cmd.fill = opts.foreColor;
    return new CanvasMark(cmd);
  }
  /**
   * Resolve a marker's SVG path `d` (non-circle shapes) lazily at paint time.
   * @param {number} x @param {number} y @param {number} shapeId @param {number} size
   * @returns {string}
   */
  markerPath(x, y, shapeId, size) {
    return this._g.getMarkerPath(x, y, SHAPE_NAME[shapeId] || "circle", size);
  }
}
const SVGElement = ApexCharts.__apex_SVGElement;
const TWO_PI = Math.PI * 2;
const DPR_CAP = 2;
class CanvasCompositor {
  /** @param {any} w */
  constructor(w) {
    this.w = w;
    this._host = null;
    this._canvas = null;
    this._c2d = null;
    this._margin = 0;
    this._dpr = 1;
    this._dim = null;
    this._alpha = 1;
    this._unitPaths = /* @__PURE__ */ new Map();
    this._markerBatches = 0;
  }
  /** Marker style-batches applied during the last paint() (dev/test hook). */
  markerBatchCount() {
    return this._markerBatches;
  }
  /**
   * Opacity multiplier for a series index under the active dim spec: 1 for the
   * highlighted series (or when not dimming, or for unidentified marks), else
   * the inactive opacity.
   * @param {number} si
   * @returns {number}
   */
  _seriesAlpha(si) {
    const d = this._dim;
    if (!d || d.active == null || d.active < 0 || si == null || si < 0) return 1;
    return si === d.active ? 1 : d.opacity == null ? 0.2 : d.opacity;
  }
  _plotDims() {
    var _a;
    const gw = Math.max(0, Math.ceil(this.w.layout.gridWidth || 0));
    const gh = Math.max(0, Math.ceil(this.w.layout.gridHeight || 0));
    const largest = ((_a = this.w.globals.markers) == null ? void 0 : _a.largestSize) || 0;
    const margin = Math.ceil(largest + 8);
    return { gw, gh, margin };
  }
  /**
   * Create (or recreate) the foreignObject + canvas sized to the plot rect and
   * return the SVGElement host that `plotChartType` inserts into the tree.
   * @returns {any}
   */
  createHost() {
    const win = BrowserAPIs.getWindow();
    this._dpr = Math.min(DPR_CAP, win && win.devicePixelRatio || 1);
    const { gw, gh, margin } = this._plotDims();
    this._margin = margin;
    const w = gw + margin * 2;
    const h2 = gh + margin * 2;
    const fo = BrowserAPIs.createElementNS(SVGNS, "foreignObject");
    fo.setAttribute("x", String(-margin));
    fo.setAttribute("y", String(-margin));
    fo.setAttribute("width", String(w));
    fo.setAttribute("height", String(h2));
    fo.setAttribute("class", "apexcharts-canvas-series");
    fo.style.overflow = "visible";
    const canvas = (
      /** @type {any} */
      BrowserAPIs.createElement("canvas")
    );
    canvas.setAttribute("class", "apexcharts-series-canvas");
    canvas.width = Math.max(1, Math.round(w * this._dpr));
    canvas.height = Math.max(1, Math.round(h2 * this._dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h2 + "px";
    canvas.style.pointerEvents = "none";
    fo.appendChild(canvas);
    this._canvas = canvas;
    this._c2d = canvas.getContext("2d");
    this._host = new SVGElement(fo);
    return this._host;
  }
  getHost() {
    return this._host;
  }
  clear() {
    if (!this._c2d || !this._canvas) return;
    this._c2d.setTransform(1, 0, 0, 1, 0, 0);
    this._c2d.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }
  /**
   * Re-check devicePixelRatio before painting: a restyle() repaint after the
   * window moved between monitors would otherwise keep the stale backing-store
   * scale (blurry or over-sized) until the next full render rebuilds the host.
   * The canvas CSS size is unchanged; only the backing store is resized.
   */
  _syncDpr() {
    if (!this._canvas) return;
    const win = BrowserAPIs.getWindow();
    const dpr = Math.min(DPR_CAP, win && win.devicePixelRatio || 1);
    if (dpr === this._dpr) return;
    this._dpr = dpr;
    const wCss = parseFloat(this._canvas.style.width) || 0;
    const hCss = parseFloat(this._canvas.style.height) || 0;
    this._canvas.width = Math.max(1, Math.round(wCss * dpr));
    this._canvas.height = Math.max(1, Math.round(hCss * dpr));
  }
  /**
   * Paint the recorded scene: object commands (series bodies / rects / lines /
   * text) first, then the columnar markers on top (matching SVG z-order where
   * markers sit above the series path). `shim` supplies the columnar marker
   * arrays + lazy non-circle marker geometry.
   * @param {any[]} list
   * @param {any} shim
   * @param {{active:number, opacity:number}|null} [dim] per-series dim spec
   *   (hover / legend restyle); null repaints at full opacity.
   */
  paint(list, shim, dim = null) {
    const ctx = this._c2d;
    if (!ctx) return;
    this._dim = dim || null;
    this._syncDpr();
    this.clear();
    const dpr = this._dpr;
    const m = this._margin;
    ctx.setTransform(dpr, 0, 0, dpr, m * dpr, m * dpr);
    if (list.length) {
      const ordered = list.length > 1 ? list.map((c2, i2) => [c2, i2]).sort(
        (a2, b) => a2[0].z === b[0].z ? a2[1] - b[1] : a2[0].z - b[0].z
      ).map((pair) => pair[0]) : list;
      for (let i2 = 0; i2 < ordered.length; i2++) {
        const c2 = ordered[i2];
        this._alpha = this._dim ? this._seriesAlpha(c2.si) : 1;
        this._paintOne(ctx, c2);
      }
    }
    this._paintRects(ctx, shim);
    this._paintMarkers(ctx, shim);
    this._alpha = 1;
  }
  /**
   * Paint the columnar rect cells (heatmap) as STYLE BATCHES: one fill/stroke
   * state application per run of consecutive same-style cells, then a fast
   * fillRect (or a roundRect path when the shared corner radius is non-zero)
   * per cell. Clipped to the plot rect so cells never bleed into the canvas
   * margin (mirrors the SVG gridRectMask). Per-cell globalAlpha carries the
   * hover/legend dim multiplier when a dim spec is active.
   * @param {any} ctx
   * @param {any} shim
   */
  _paintRects(ctx, shim) {
    const n2 = shim.rectCount ? shim.rectCount() : 0;
    if (!n2) return;
    const rx = shim._crx;
    const ry = shim._cry;
    const rw = shim._crw;
    const rh = shim._crh;
    const rstyle = shim._crstyle;
    const radius = shim._cellRadius || 0;
    const cx = (
      /** @type {any} */
      ctx
    );
    const useRound = radius > 0 && typeof cx.roundRect === "function";
    const dimming = !!this._dim;
    const gw = Math.max(0, this.w.layout.gridWidth || 0);
    const gh = Math.max(0, this.w.layout.gridHeight || 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, gw, gh);
    ctx.clip();
    let i2 = 0;
    while (i2 < n2) {
      const styleId = rstyle[i2];
      const style = shim.rectStyle(i2);
      if (!style) {
        i2++;
        continue;
      }
      const fill = style.fill;
      const doFill = fill && fill !== "none" && !(typeof fill === "string" && fill.indexOf("url(") === 0);
      const stroke = style.stroke;
      const sw = style.strokeWidth == null ? 0 : Number(style.strokeWidth);
      const doStroke = stroke && stroke !== "none" && sw > 0 && !(typeof stroke === "string" && stroke.indexOf("url(") === 0);
      if (doFill) ctx.fillStyle = fill;
      if (doStroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sw;
        ctx.setLineDash([]);
      }
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity);
      const baseStrokeA = style.strokeOpacity == null ? 1 : Number(style.strokeOpacity);
      let j = i2;
      while (j < n2 && rstyle[j] === styleId) {
        const w = rw[j];
        const h2 = rh[j];
        if (w > 0 && h2 > 0) {
          const f = dimming ? this._seriesAlpha(shim.rectSeries(j)) : 1;
          if (useRound) {
            ctx.beginPath();
            cx.roundRect(rx[j], ry[j], w, h2, radius);
            if (doFill) {
              ctx.globalAlpha = baseFillA * f;
              ctx.fill();
            }
            if (doStroke) {
              ctx.globalAlpha = baseStrokeA * f;
              ctx.stroke();
            }
          } else {
            if (doFill) {
              ctx.globalAlpha = baseFillA * f;
              ctx.fillRect(rx[j], ry[j], w, h2);
            }
            if (doStroke) {
              ctx.globalAlpha = baseStrokeA * f;
              ctx.strokeRect(rx[j], ry[j], w, h2);
            }
          }
        }
        j++;
      }
      i2 = j;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  /**
   * Reusable unit Path2D for a (shape, size): the shape's geometry built at the
   * origin once, then translated per marker via setTransform. Returns null when
   * the geometry string cannot be parsed.
   * @param {any} shim
   * @param {number} shapeId
   * @param {number} size
   * @returns {any}
   */
  _unitPath(shim, shapeId, size) {
    const key = shapeId + "|" + size;
    let p = this._unitPaths.get(key);
    if (p === void 0) {
      try {
        p = new Path2D(shim.markerPath(0, 0, shapeId, size));
      } catch (e2) {
        p = null;
      }
      this._unitPaths.set(key, p);
    }
    return p;
  }
  /**
   * Markers paint as STYLE BATCHES: one fill/stroke state application per run
   * of consecutive same-style markers (a uniform single-series scatter is
   * exactly one batch), then per-marker geometry inside the run. Per-marker
   * geometry stays painter's-ordered (fill+stroke per marker) so overlapping
   * semi-transparent markers composite exactly as SVG does.
   * @param {any} ctx
   * @param {any} shim
   */
  _paintMarkers(ctx, shim) {
    this._markerBatches = 0;
    const n2 = shim.markerCount();
    if (!n2) return;
    const mx = shim._mx;
    const my = shim._my;
    const msize = shim._msize;
    const mshape = shim._mshape;
    const mstyle = shim._mstyle;
    const dimming = !!this._dim;
    if (!dimming) this._alpha = 1;
    let i2 = 0;
    while (i2 < n2) {
      const styleId = mstyle[i2];
      const shapeId = mshape[i2];
      const style = shim.markerStyle(i2);
      if (!style) {
        i2++;
        continue;
      }
      const doFill = this._applyFill(ctx, style);
      const doStroke = this._applyStroke(ctx, style);
      this._markerBatches++;
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity);
      const baseStrokeA = style.strokeOpacity == null ? 1 : Number(style.strokeOpacity);
      if (shapeId === 0) {
        let j = i2;
        while (j < n2 && mshape[j] === 0 && mstyle[j] === styleId) {
          const r2 = msize[j] || 0;
          const y = my[j];
          if (r2 > 0 && y === y) {
            ctx.beginPath();
            ctx.arc(mx[j], y, r2, 0, TWO_PI);
            if (dimming) {
              const f = this._seriesAlpha(shim.markerSeries(j));
              if (doFill) {
                ctx.globalAlpha = baseFillA * f;
                ctx.fill();
              }
              if (doStroke) {
                ctx.globalAlpha = baseStrokeA * f;
                ctx.stroke();
              }
            } else {
              if (doFill) ctx.fill();
              if (doStroke) ctx.stroke();
            }
          }
          j++;
        }
        ctx.globalAlpha = 1;
        i2 = j;
      } else {
        const dpr = this._dpr;
        const m = this._margin;
        let j = i2;
        while (j < n2 && mshape[j] === shapeId && mstyle[j] === styleId) {
          const y = my[j];
          const size = msize[j];
          if (y === y && size > 0) {
            const p = this._unitPath(shim, shapeId, size);
            if (p) {
              ctx.setTransform(dpr, 0, 0, dpr, (m + mx[j]) * dpr, (m + y) * dpr);
              const f = dimming ? this._seriesAlpha(shim.markerSeries(j)) : 1;
              if (doFill) {
                ctx.globalAlpha = baseFillA * f;
                ctx.fill(p);
              }
              if (doStroke) {
                ctx.globalAlpha = baseStrokeA * f;
                ctx.stroke(p);
              }
            }
          }
          j++;
        }
        ctx.setTransform(dpr, 0, 0, dpr, m * dpr, m * dpr);
        ctx.globalAlpha = 1;
        i2 = j;
      }
    }
  }
  /**
   * Paint a series path from its numeric fast-path coords: a direct
   * moveTo/lineTo loop over the typed arrays, no Path2D and no d-string
   * parse. `ncloseY` (areas) closes the polygon down to the baseline exactly
   * like the string form's `L xLast bottom L x0 bottom z` tail.
   * @param {any} ctx
   * @param {any} cmd
   */
  _paintNumericPath(ctx, cmd) {
    const xs = cmd.nxs;
    const ys = cmd.nys;
    const n2 = xs.length;
    if (!n2) return;
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let k = 1; k < n2; k++) {
      ctx.lineTo(xs[k], ys[k]);
    }
    if (cmd.ncloseY != null) {
      ctx.lineTo(xs[n2 - 1], cmd.ncloseY);
      ctx.lineTo(xs[0], cmd.ncloseY);
      ctx.closePath();
    }
    if (this._applyFill(ctx, cmd)) {
      ctx.fill(cmd.fillRule === "evenodd" ? "evenodd" : "nonzero");
    }
    if (this._applyStroke(ctx, cmd)) {
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /**
   * @param {any} ctx
   * @param {any} cmd style-bearing flat command
   */
  _paintOne(ctx, cmd) {
    switch (cmd.tag) {
      case "path": {
        if (cmd.nxs) {
          this._paintNumericPath(ctx, cmd);
          break;
        }
        if (!cmd.d) return;
        if (!cmd.path2d) {
          try {
            cmd.path2d = new Path2D(cmd.d);
          } catch (e2) {
            return;
          }
        }
        this._fillStrokePath(ctx, cmd, cmd.path2d);
        break;
      }
      case "rect": {
        const p = new Path2D();
        if (cmd.radius && typeof /** @type {any} */
        p.roundRect === "function") {
          p.roundRect(cmd.x1, cmd.y1, cmd.rw, cmd.rh, cmd.radius);
        } else {
          p.rect(cmd.x1, cmd.y1, cmd.rw, cmd.rh);
        }
        this._fillStrokePath(ctx, cmd, p);
        break;
      }
      case "circle": {
        if (!(cmd.r > 0)) return;
        ctx.beginPath();
        ctx.arc(cmd.cx, cmd.cy, cmd.r, 0, TWO_PI);
        this._fillStroke(ctx, cmd);
        break;
      }
      case "line": {
        ctx.beginPath();
        ctx.moveTo(cmd.lx1, cmd.ly1);
        ctx.lineTo(cmd.lx2, cmd.ly2);
        this._strokeOnly(ctx, cmd);
        break;
      }
      case "text": {
        if (cmd.text == null) return;
        ctx.save();
        ctx.globalAlpha = this._alpha;
        ctx.fillStyle = cmd.fill || "#000";
        const size = cmd.fontSize || "11px";
        ctx.font = `${typeof size === "number" ? size + "px" : size} ${cmd.fontFamily || "Helvetica, Arial, sans-serif"}`;
        ctx.textAlign = cmd.textAnchor === "middle" ? "center" : cmd.textAnchor === "end" ? "right" : "left";
        ctx.fillText(String(cmd.text), cmd.tx, cmd.ty);
        ctx.restore();
        break;
      }
    }
  }
  /**
   * @param {any} ctx
   * @param {any} style
   * @param {any} path2d
   */
  _fillStrokePath(ctx, style, path2d) {
    if (this._applyFill(ctx, style)) {
      ctx.fill(path2d, style.fillRule === "evenodd" ? "evenodd" : "nonzero");
    }
    if (this._applyStroke(ctx, style)) {
      ctx.stroke(path2d);
    }
    ctx.globalAlpha = 1;
  }
  /**
   * @param {any} ctx
   * @param {any} style
   */
  _fillStroke(ctx, style) {
    if (this._applyFill(ctx, style)) ctx.fill();
    if (this._applyStroke(ctx, style)) ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /**
   * @param {any} ctx
   * @param {any} style
   */
  _strokeOnly(ctx, style) {
    if (this._applyStroke(ctx, style)) ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /**
   * Set fill state. Returns false when there's nothing to fill.
   * @param {any} ctx
   * @param {any} style
   */
  _applyFill(ctx, style) {
    const fill = style.fill;
    if (!fill || fill === "none") return false;
    if (typeof fill === "string" && fill.indexOf("url(") === 0) return false;
    ctx.globalAlpha = (style.fillOpacity == null ? 1 : Number(style.fillOpacity)) * this._alpha;
    ctx.fillStyle = fill;
    return true;
  }
  /**
   * Set stroke state. Returns false when there's nothing to stroke.
   * @param {any} ctx
   * @param {any} style
   */
  _applyStroke(ctx, style) {
    const stroke = style.stroke;
    const sw = style.strokeWidth == null ? 1 : Number(style.strokeWidth);
    if (!stroke || stroke === "none" || !(sw > 0)) return false;
    if (typeof stroke === "string" && stroke.indexOf("url(") === 0) return false;
    ctx.globalAlpha = (style.strokeOpacity == null ? 1 : Number(style.strokeOpacity)) * this._alpha;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = sw;
    ctx.lineCap = style.lineCap || "butt";
    const dash = style.strokeDash;
    if (dash && dash !== 0) {
      ctx.setLineDash(Array.isArray(dash) ? dash : [Number(dash)]);
    } else {
      ctx.setLineDash([]);
    }
    return true;
  }
  /** Series bitmap for the export composite bridge (P4). @returns {string|null} */
  toDataURL() {
    return this._canvas ? this._canvas.toDataURL() : null;
  }
  destroy() {
    this._host = null;
    this._canvas = null;
    this._c2d = null;
    this._unitPaths.clear();
  }
}
class CanvasRenderer {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.kind = "canvas";
    this._g = new CanvasGraphics(w);
    this._compositor = new CanvasCompositor(w);
  }
  // ── lifecycle ──
  /** Start a fresh series display list for this render pass. */
  beginSeries() {
    this._g.reset();
  }
  /**
   * Finalize the pass: paint the recorded display list and return the SVG host
   * (a `<foreignObject><canvas>`) for `plotChartType` to composite into the tree.
   * @returns {any}
   */
  present() {
    const host = this._compositor.createHost();
    this._compositor.paint(this._g.displayList(), this._g);
    return host;
  }
  /** Fast-path wipe of the series layer. */
  clear() {
    this._compositor.clear();
  }
  /**
   * Whether the existing <canvas> host can be repainted in place (it exists
   * and is still mounted). Used by the data-only fast update path to skip
   * recreating the foreignObject + backing store on every tick.
   * @returns {boolean}
   */
  canRepaintInPlace() {
    const host = this._compositor.getHost();
    return !!(host && host.node && host.node.isConnected);
  }
  /** Repaint the freshly recorded display list into the EXISTING canvas. */
  repaintInPlace() {
    this._compositor.paint(this._g.displayList(), this._g);
  }
  // ── emit primitives (delegate to the display-list shim) ──
  /** @param {any} attrs */
  group(attrs) {
    return this._g.group(attrs);
  }
  /** @param {any} opts */
  drawPath(opts) {
    return this._g.drawPath(opts);
  }
  /** @param {any[]} args */
  drawLine(...args) {
    return (
      /** @type {any} */
      this._g.drawLine(...args)
    );
  }
  /** @param {any[]} args */
  drawRect(...args) {
    return (
      /** @type {any} */
      this._g.drawRect(...args)
    );
  }
  /**
   * Columnar heatmap-cell rect (dense same-shape rects): recorded into typed
   * arrays, painted as style batches. Distinct from drawRect (object command)
   * so 100k cells don't allocate 100k retained commands.
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {any} opts
   */
  drawRectCell(x, y, w, h2, opts) {
    return this._g.drawRectCell(x, y, w, h2, opts);
  }
  /**
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r2, attrs) {
    return this._g.drawCircle(r2, attrs);
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x, y, opts) {
    return this._g.drawMarker(x, y, opts);
  }
  /** @param {any} opts */
  renderPaths(opts) {
    return this._g.renderPaths(opts);
  }
  /** @param {any} opts */
  drawText(opts) {
    return this._g.drawText(opts);
  }
  // ── capabilities ──
  /** @param {string} feature */
  supports(feature) {
    return feature === "solidFill" || feature === "dashArray";
  }
  // ── interaction ──
  // Line/area/bar/scatter tooltips resolve via coordinate lookup (pointsArray),
  // so those need no per-mark query. Heatmap cells, however, are hovered by
  // point (the SVG path hit-tests the <rect> under the cursor); with cells on
  // canvas there is no node, so hitTest resolves the columnar rect store.
  /**
   * Find the cell under a plot-local point (0,0 = plot origin, the same space
   * as the recorded cell geometry). Reverse scan so a later-painted cell wins
   * when cells overlap (continuous-x edges). A linear scan stays well under a
   * frame even at 100k cells (~100k integer compares). Returns the cell's
   * series/dataPoint index plus its geometry for tooltip positioning, or null
   * when the point is off every cell.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,width:number,height:number})|null}
   */
  hitTest(px, py) {
    const g = this._g;
    const n2 = g.rectCount ? g.rectCount() : 0;
    if (!n2) return null;
    const rx = g._crx;
    const ry = g._cry;
    const rw = g._crw;
    const rh = g._crh;
    for (let k = n2 - 1; k >= 0; k--) {
      const w = rw[k];
      const h2 = rh[k];
      if (w <= 0 || h2 <= 0) continue;
      if (px >= rx[k] && px < rx[k] + w && py >= ry[k] && py < ry[k] + h2) {
        return {
          seriesIndex: g._crsi[k],
          dataPointIndex: g._crdi[k],
          x: rx[k],
          y: ry[k],
          width: w,
          height: h2
        };
      }
    }
    return null;
  }
  /**
   * Repaint the retained series scene with a per-series dim spec (hover /
   * legend restyle). No geometry recompute: reuses the display list + marker
   * columns recorded at render time. Pass null to repaint at full opacity.
   * @param {{active:number, opacity:number}|null} [dim]
   */
  restyle(dim) {
    this._compositor.paint(this._g.displayList(), this._g, dim || null);
  }
  // ── export ── toBitmap() and the compositor's toDataURL() back
  //    Exports.inlineCanvasLayers, which inlines the series bitmap as an SVG
  //    <image> so PNG/SVG export includes the canvas layer in correct z-order.
  /** @returns {{dataURL:string,x:number,y:number,w:number,h:number}|null} */
  toBitmap() {
    const url = this._compositor.toDataURL();
    if (!url) return null;
    const gl = this.w.globals;
    const cfg = this.w.config.chart;
    const margin = this._compositor._margin;
    return {
      dataURL: url,
      x: (gl.translateX || 0) + (cfg.offsetX || 0) - margin,
      y: (gl.translateY || 0) + (cfg.offsetY || 0) - margin,
      w: (this.w.layout.gridWidth || 0) + margin * 2,
      h: (this.w.layout.gridHeight || 0) + margin * 2
    };
  }
  destroy() {
    this._compositor.destroy();
  }
}
ApexCharts__default.registerRenderer(
  "canvas",
  /**
   * @param {any} w
   * @param {any} ctx
   */
  (w, ctx) => new CanvasRenderer(w, ctx)
);
function seriesEmitter(ctx, graphics) {
  const r2 = ctx && ctx.renderer;
  return r2 && r2.kind && r2.kind !== "svg" ? r2 : graphics;
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
          } catch (e2) {
            if (!this._warned) {
              console.warn(
                `[apexcharts] renderItem for series type "${name}" threw; skipping datum:`,
                e2
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
      const n2 = nPts || gl.dataPoints || 1;
      const bandW = n2 > 0 ? gridWidth / n2 : gridWidth;
      const tickOn = cnf.xaxis.tickPlacement === "on";
      const x = (v) => xRatio ? (v - gl.minX) / xRatio : gridWidth / 2;
      const y = (v) => (maxY - v) / yr;
      const xAt = (index, v) => {
        if (!catMode) return x(v);
        if (tickOn && n2 > 1) return index / (n2 - 1) * gridWidth;
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
          } catch (e2) {
          }
          elSeries.add(el);
        }
        return el;
      };
      return {
        /** @param {any} o */
        path: (o2 = {}) => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i;
          return tag(
            emit.drawPath({
              d: o2.d || "",
              stroke: (_a = o2.stroke) != null ? _a : "#000",
              strokeWidth: (_c = (_b = o2.width) != null ? _b : o2.strokeWidth) != null ? _c : 1,
              fill: (_d = o2.fill) != null ? _d : "none",
              fillOpacity: (_f = o2.fillOpacity) != null ? _f : o2.fill && o2.fill !== "none" ? (_e = o2.opacity) != null ? _e : 1 : 0,
              strokeOpacity: (_h = (_g = o2.strokeOpacity) != null ? _g : o2.opacity) != null ? _h : 1,
              strokeDashArray: (_i = o2.dash) != null ? _i : 0,
              strokeLinecap: o2.lineCap
            })
          );
        },
        /** @param {any} o */
        line: (o2 = {}) => {
          var _a, _b, _c, _d;
          return tag(
            emit.drawLine(
              o2.x1,
              o2.y1,
              o2.x2,
              o2.y2,
              (_a = o2.stroke) != null ? _a : "#000",
              (_b = o2.dash) != null ? _b : 0,
              (_d = (_c = o2.width) != null ? _c : o2.strokeWidth) != null ? _d : 1
            )
          );
        },
        /** @param {any} o */
        rect: (o2 = {}) => {
          var _a, _b, _c, _d, _e, _f, _g, _h;
          return tag(
            emit.drawRect(
              (_a = o2.x) != null ? _a : 0,
              (_b = o2.y) != null ? _b : 0,
              (_c = o2.w) != null ? _c : 0,
              (_d = o2.h) != null ? _d : 0,
              (_e = o2.r) != null ? _e : 0,
              (_f = o2.fill) != null ? _f : "#000",
              (_g = o2.opacity) != null ? _g : 1,
              o2.stroke != null ? (_h = o2.strokeWidth) != null ? _h : 1 : null,
              o2.stroke
            )
          );
        },
        /** @param {any} o */
        circle: (o2 = {}) => {
          var _a, _b, _c, _d, _e;
          return tag(
            emit.drawCircle((_a = o2.r) != null ? _a : 0, {
              cx: (_b = o2.cx) != null ? _b : 0,
              cy: (_c = o2.cy) != null ? _c : 0,
              fill: (_d = o2.fill) != null ? _d : "#000",
              stroke: o2.stroke || "none",
              "stroke-width": (_e = o2.strokeWidth) != null ? _e : o2.stroke ? 1 : 0
            })
          );
        },
        /** @param {any} o */
        text: (o2 = {}) => {
          var _a, _b, _c, _d;
          return tag(
            emit.drawText({
              x: (_a = o2.x) != null ? _a : 0,
              y: (_b = o2.y) != null ? _b : 0,
              text: (_c = o2.text) != null ? _c : "",
              textAnchor: (_d = o2.anchor) != null ? _d : "start",
              fontSize: o2.size,
              foreColor: o2.color,
              fontWeight: o2.weight
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
ApexCharts__default._customSeriesFactory = makeCustomSeriesClass;
const DARK_QUERY = "(prefers-color-scheme: dark)";
const CONTRAST_QUERY = "(prefers-contrast: more)";
class OSThemeWatcher {
  /**
   * @param {any} w @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    if (w.config.theme.follow !== "os" || !Environment.isBrowser()) return;
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
      const m = ctx._osThemeMedia;
      if (!m) return;
      const themeOpt = { mode: m.dark && m.dark.matches ? "dark" : "light" };
      if (m.contrast && m.contrast.matches) {
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
ApexCharts__default.registerFeatures({ osThemeWatcher: OSThemeWatcher });
const MARK_SELECTOR = [
  ".apexcharts-bar-area",
  ".apexcharts-candlestick-area",
  ".apexcharts-boxPlot-area",
  ".apexcharts-rangebar-area",
  ".apexcharts-marker"
].join(", ");
const FILTER_MARK_SELECTOR = [
  ".apexcharts-pie-area",
  ".apexcharts-bar-area"
].join(", ");
const DIMMED_CLASS = "apexcharts-crossfilter-dimmed";
const PIE_TYPES = ["pie", "donut", "polarArea", "radialBar"];
class LinkedViews {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._dimmed = false;
    this._wired = false;
    this._pending = false;
    this._lastValues = null;
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
    this._onChange = this._onChange.bind(this);
    if (this._mode() === "filter") this._initEngine();
  }
  /** @returns {'highlight'|'filter'|'off'} */
  _mode() {
    const link = this.w.config.chart.link;
    if (link && typeof link.dimension === "function") return "filter";
    if (link && link.enabled) return "highlight";
    return "off";
  }
  _enabled() {
    const link = this.w.config.chart.link;
    return !!(link && link.enabled);
  }
  /**
   * The source chart's rectangle brush produced a data-x range. In FILTER mode
   * this becomes a `[min,max]` range filter on the chart's dimension (the other
   * charts re-aggregate). In HIGHLIGHT mode (P1) it dims out-of-range marks
   * across the group. Called (null-safe) from ZoomPanSelection selectionDrawn /
   * selectionDragging.
   * @param {{min:number, max:number}} xaxis
   */
  onSourceSelection(xaxis) {
    var _a;
    const mode = this._mode();
    if (mode === "off") return;
    if (!xaxis || xaxis.min == null || xaxis.max == null) return;
    let min = Math.min(xaxis.min, xaxis.max);
    let max = Math.max(xaxis.min, xaxis.max);
    const gMinX = this.w.globals.minX;
    const gMaxX = this.w.globals.maxX;
    if (isFinite(gMinX) && isFinite(gMaxX) && gMaxX > gMinX) {
      const tol = (gMaxX - gMinX) * 1e-6;
      if (min - gMinX <= tol) min = gMinX;
      if (gMaxX - max <= tol) max = gMaxX;
    }
    if (mode === "filter") {
      const cf = this._cf();
      if (!cf) return;
      cf.filter(this._chartId(), [min, max]);
      this._fireFilterChange(cf, [min, max]);
      return;
    }
    this._group().forEach((ch) => {
      var _a2;
      (_a2 = ch == null ? void 0 : ch.linkedViews) == null ? void 0 : _a2.applyDim(min, max);
    });
    const args = { xaxis: { min, max }, sourceChartID: this.w.globals.chartID };
    if (typeof this.w.config.chart.events.crossFilter === "function") {
      this.w.config.chart.events.crossFilter(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("crossFilter", [this.ctx, args]);
  }
  /** self + grouped siblings (dedup-safe; getGroupedCharts excludes self). */
  _group() {
    const siblings = typeof this.ctx.getGroupedCharts === "function" ? this.ctx.getGroupedCharts() : [];
    return [this.ctx, ...siblings];
  }
  /**
   * Dim this chart's marks whose x is outside [min,max]; un-dim those inside.
   * No re-render, so mark identities are preserved.
   * @param {number} min @param {number} max
   */
  applyDim(min, max) {
    if (!this._enabled()) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const dimOpacity = w.config.chart.link.dimOpacity;
    if (w.dom.elWrap && typeof dimOpacity === "number") {
      w.dom.elWrap.style.setProperty("--apx-cf-dim", String(dimOpacity));
    }
    const seriesX = w.globals.seriesX || [];
    const marks = baseEl.querySelectorAll(MARK_SELECTOR);
    marks.forEach((node) => {
      const jAttr = node.getAttribute("j");
      if (jAttr === null) return;
      const j = parseInt(jAttr, 10);
      const iAttr = node.getAttribute("index");
      const i2 = iAttr === null ? 0 : parseInt(iAttr, 10);
      const row = seriesX[i2] || seriesX[0];
      if (!row) return;
      const x = row[j];
      if (x == null) return;
      node.classList.toggle(DIMMED_CLASS, x < min || x > max);
    });
    this._dimmed = true;
  }
  /** Remove dimming from this chart only. */
  clear() {
    const baseEl = this.w.dom.baseEl;
    if (!baseEl) return;
    baseEl.querySelectorAll("." + DIMMED_CLASS).forEach((n2) => n2.classList.remove(DIMMED_CLASS));
    this._dimmed = false;
  }
  /** Clear dimming across the whole group (backs chart.clearCrossfilter). */
  clearGroup() {
    if (this._mode() === "filter") {
      const cf = this._cf();
      if (cf) cf.reset();
      return;
    }
    this._group().forEach((ch) => {
      var _a;
      return (_a = ch == null ? void 0 : ch.linkedViews) == null ? void 0 : _a.clear();
    });
  }
  // ─── FILTER mode (crossfilter engine glue) ───────────────────────────────
  /**
   * The chart's stable internal id (keys its dimension in the coordinator).
   * Always set by the ApexCharts constructor (falls back to a cuid).
   * @returns {string}
   */
  _chartId() {
    return (
      /** @type {string} */
      this.w.globals.chartID
    );
  }
  /** @returns {import('./Crossfilter').default|null} the coordinator, or null */
  _cf() {
    const link = this.w.config.chart.link;
    const id = link && (link.id || this.w.config.chart.group);
    return id ? se.get(id) : null;
  }
  _isPie() {
    return PIE_TYPES.indexOf(this.w.config.chart.type) !== -1;
  }
  _isHeatmap() {
    return this.w.config.chart.type === "heatmap";
  }
  /**
   * Before the first render: resolve the coordinator, register this chart's
   * dimension, inject the initial aggregated series into w.config (so the first
   * paint is already aggregated, no empty flash), and wire the listeners.
   */
  _initEngine() {
    const cf = this._cf();
    const link = this.w.config.chart.link;
    if (!cf) {
      const id = link && link.id || this.w.config.chart.group;
      console.warn(
        `[apexcharts] chart.link.dimension is set but no crossfilter coordinator "${id}" exists. Call ApexCharts.crossfilter({ id, records }) before creating the chart.`
      );
      return;
    }
    const chartId = this._chartId();
    if (!cf.hasDimension(chartId)) {
      cf.registerDimension(chartId, {
        dimension: link.dimension,
        reduce: link.reduce,
        // heatmap => 2D matrix dimension (accessor returns [xKey, yKey]).
        type: link.type || (this._isHeatmap() ? "matrix" : void 0),
        bins: link.bins,
        order: link.order
      });
    }
    this._injectSeries(cf.aggregateFor(chartId));
    this._wire(cf);
  }
  /**
   * Build the chart's series value from an aggregation, shaped by chart type:
   *   matrix (heatmap) -> [{ name:yKey, data:[{x:xKey, y:value}] }]
   *   pie/donut  -> number[]
   *   axis + category -> [{ name, data:number[] }] (categories set separately)
   *   axis + range    -> [{ name, data:[x,value][] }] on a numeric/time x-axis
   * @param {any} agg
   */
  _seriesFromAgg(agg) {
    if (agg.type === "matrix") {
      return agg.yLabels.map((yl, yi) => ({
        name: String(yl),
        data: agg.xLabels.map((xl, xi) => ({
          x: String(xl),
          y: agg.matrix[yi][xi]
        }))
      }));
    }
    if (this._isPie()) return agg.values.slice();
    const name = this.w.config.chart.link.seriesName || "Count";
    if (agg.type === "range") {
      return [{ name, data: agg.labels.map((x, i2) => [x, agg.values[i2]]) }];
    }
    return [{ name, data: agg.values.slice() }];
  }
  /**
   * Value signature used to skip a reflow when only dimming changed.
   * @param {any} agg
   */
  _sigOf(agg) {
    return JSON.stringify(agg.matrix || agg.values);
  }
  /**
   * Write the aggregation into w.config as the chart's series/labels. Runs once
   * before the first paint; later updates go through updateSeries.
   * @param {any} agg
   */
  _injectSeries(agg) {
    const w = this.w;
    this._lastValues = this._sigOf(agg);
    w.config.series = this._seriesFromAgg(agg);
    if (agg.type === "matrix") return;
    if (this._isPie()) {
      w.config.labels = agg.labels.map(String);
    } else if (agg.type === "category") {
      if (!w.config.xaxis) w.config.xaxis = {};
      w.config.xaxis.categories = agg.labels.map(String);
    } else if (agg.type === "range") {
      this._pinRangeDomain(agg.edges);
    }
  }
  /**
   * Pin the numeric/datetime x-axis to the outer bin edges of a range-binned
   * dimension (unless the user set xaxis.min/max explicitly). See _injectSeries.
   * @param {number[]|null|undefined} edges
   */
  _pinRangeDomain(edges) {
    if (!Array.isArray(edges) || edges.length < 2) return;
    const w = this.w;
    if (!w.config.xaxis) w.config.xaxis = /** @type {any} */
    {};
    if (w.config.xaxis.min == null) w.config.xaxis.min = edges[0];
    if (w.config.xaxis.max == null) w.config.xaxis.max = edges[edges.length - 1];
  }
  /** @param {import('./Crossfilter').default} cf */
  _wire(cf) {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("dataPointSelection", this._onPointSelect);
    this.ctx.addEventListener("mounted", this._afterRender);
    this.ctx.addEventListener("updated", this._afterRender);
    cf.on("change", this._onChange);
  }
  /**
   * A pie slice / bar was clicked: toggle its bucket key on the coordinator.
   * @param {any} _e @param {any} _ctx @param {{dataPointIndex?:number}} opts
   */
  _onPointSelect(_e, _ctx, opts) {
    if (this._mode() !== "filter" || !opts || opts.dataPointIndex == null) return;
    const cf = this._cf();
    if (!cf) return;
    const chartId = this._chartId();
    const agg = cf.aggregateFor(chartId);
    if (agg.type === "matrix") return;
    const key = agg.keys[opts.dataPointIndex];
    if (key == null) return;
    cf.toggleKey(chartId, key);
    this._fireFilterChange(cf, key);
  }
  /** Coordinator filter changed: re-aggregate this chart on a microtask so the
   *  triggering click handler unwinds before we destroy/redraw the DOM. */
  _onChange() {
    if (this._mode() !== "filter" || this._pending) return;
    this._pending = true;
    Promise.resolve().then(() => {
      this._pending = false;
      if (this.w.globals.isDestroyed) return;
      this._applyAggregation();
    });
  }
  /**
   * Pull this chart's crossfilter aggregation and push it through updateSeries
   * (animated). When the values are unchanged (e.g. only this chart's own
   * filter moved, which it ignores for itself), skip the reflow and just
   * refresh the self-dim.
   */
  _applyAggregation() {
    if (this._mode() !== "filter") return;
    const cf = this._cf();
    if (!cf) return;
    const agg = cf.aggregateFor(this._chartId());
    const sig = this._sigOf(agg);
    if (sig === this._lastValues) {
      this._applySelfDim();
      return;
    }
    this._lastValues = sig;
    this.ctx.updateSeries(this._seriesFromAgg(agg), true);
  }
  _afterRender() {
    if (this._mode() !== "filter") return;
    const series = this.w.config.series;
    if (!series || series.length === 0) {
      this._reassertSeries();
      return;
    }
    this._applySelfDim();
  }
  /** Restore the aggregated series after an external updateSeries emptied it.
   *  Deferred a microtask so the triggering update fully unwinds first. */
  _reassertSeries() {
    if (this._pending) return;
    this._pending = true;
    Promise.resolve().then(() => {
      this._pending = false;
      if (this.w.globals.isDestroyed) return;
      const cf = this._cf();
      if (!cf) return;
      const agg = cf.aggregateFor(this._chartId());
      const series = this._seriesFromAgg(agg);
      if (!series.length) return;
      this._lastValues = this._sigOf(agg);
      this.ctx.updateSeries(series, true);
    });
  }
  /**
   * Dim this chart's own buckets that are not in its own filter (no filter ->
   * none dimmed). Categorical: dim buckets whose key is not in the selected Set.
   * Range: dim bins lying fully outside the selected `[min,max]`. Keyed by each
   * mark's `j` (dataPointIndex) -> the aggregation key.
   */
  _applySelfDim() {
    const cf = this._cf();
    if (!cf) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const chartId = this._chartId();
    const filter = cf.filterOf(chartId);
    const dimOpacity = w.config.chart.link.dimOpacity;
    if (w.dom.elWrap && typeof dimOpacity === "number") {
      w.dom.elWrap.style.setProperty("--apx-cf-dim", String(dimOpacity));
    }
    const isCategory = filter instanceof Set;
    const isRange = Array.isArray(filter);
    const agg = cf.aggregateFor(chartId);
    if (agg.type === "matrix") return;
    const keys = agg.keys;
    baseEl.querySelectorAll(FILTER_MARK_SELECTOR).forEach((node) => {
      const jAttr = node.getAttribute("j");
      if (jAttr === null) return;
      const key = keys[parseInt(jAttr, 10)];
      let dim = false;
      if (isCategory) {
        dim = !/** @type {Set<any>} */
        filter.has(key);
      } else if (isRange && Array.isArray(key)) {
        dim = key[1] <= filter[0] || key[0] >= filter[1];
      }
      node.classList.toggle(DIMMED_CLASS, dim);
    });
    this._dimmed = !!filter;
  }
  /**
   * Fire the `filterChange` event on this (source) chart.
   * @param {import('./Crossfilter').default} cf @param {any} key
   */
  _fireFilterChange(cf, key) {
    var _a;
    const args = __spreadProps(__spreadValues({}, cf.state()), {
      sourceChartID: this._chartId(),
      key
    });
    const events = this.w.config.chart.events;
    if (typeof events.filterChange === "function") {
      events.filterChange(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("filterChange", [this.ctx, args]);
  }
  teardown() {
    var _a, _b, _c, _d, _e, _f;
    this.clear();
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "dataPointSelection", this._onPointSelect);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "mounted", this._afterRender);
      (_f = (_e = this.ctx).removeEventListener) == null ? void 0 : _f.call(_e, "updated", this._afterRender);
      const cf = this._cf();
      if (cf) {
        cf.off("change", this._onChange);
        cf.removeDimension(this._chartId());
      }
      this._wired = false;
    }
  }
}
ApexCharts__default.registerFeatures({ linkedViews: LinkedViews });
const AC = (
  /** @type {any} */
  ApexCharts__default
);
AC._crossfilterFactory = (opts) => se.getOrCreate(opts);
AC._crossfilterGet = (id) => se.get(id);
const DRAG_CLASS = "apexcharts-ink-draggable";
const TYPES = ["point", "xaxis", "yaxis"];
const EDGE_PX = 8;
const CLICK_SLOP_PX = 2;
const FONT_STEPS = [10, 11, 12, 14, 17, 20];
const MARKER_SHAPES = ["circle", "square", "diamond", "triangle"];
const SHAPE_GLYPHS = {
  circle: "●",
  square: "■",
  diamond: "◆",
  triangle: "▲"
};
const NOTE_COLORS = [
  "#ffffff",
  "#334155",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626"
];
const TRASH_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';
class InkLayer {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._wired = false;
    this._drag = null;
    this._editor = null;
    this._creating = false;
    this._createSeq = 0;
    this._attach = this._attach.bind(this);
    this._onRerender = this._onRerender.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onCreateClick = this._onCreateClick.bind(this);
    this._onDocDownEditor = this._onDocDownEditor.bind(this);
    if (this._enabledGlobally() || this._hasDraggable() || this._paletteEnabled()) {
      this._wire();
    }
  }
  _enabledGlobally() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.enabled);
  }
  _paletteEnabled() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.palette);
  }
  _snapEnabled() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.snap);
  }
  // ─── P5: snap to gridlines ────────────────────────────────────────────────
  /** @param {number} v @param {number[]} ticks @returns {number} nearest tick */
  _nearest(v, ticks) {
    let best = v;
    let bd = Infinity;
    for (let i2 = 0; i2 < ticks.length; i2++) {
      const d = Math.abs(ticks[i2] - v);
      if (d < bd) {
        bd = d;
        best = ticks[i2];
      }
    }
    return best;
  }
  /**
   * Snap an x value to the nearest x gridline (numeric axes only).
   * @param {number} x
   */
  _snapX(x) {
    if (!this._snapEnabled() || typeof x !== "number") return x;
    const s2 = this.w.globals.xAxisScale;
    return s2 && Array.isArray(s2.result) && s2.result.length ? this._nearest(x, s2.result) : x;
  }
  /**
   * Snap a y value to the nearest y gridline.
   * @param {number} y @param {number} si
   */
  _snapY(y, si) {
    if (!this._snapEnabled() || typeof y !== "number") return y;
    const scales = this.w.globals.yAxisScale;
    const s2 = scales && scales[si];
    return s2 && Array.isArray(s2.result) && s2.result.length ? this._nearest(y, s2.result) : y;
  }
  /** @param {string} type @returns {any[]} the config annotations of a type */
  _annoList(type) {
    const a2 = this.w.config.annotations;
    if (!a2) return [];
    const key = type === "point" ? "points" : type;
    return Array.isArray(a2[key]) ? a2[key] : [];
  }
  /** @param {any} anno */
  _isDraggable(anno) {
    if (!anno) return false;
    if (anno.draggable === true) return true;
    if (anno.draggable === false) return false;
    return this._enabledGlobally();
  }
  _hasDraggable() {
    return TYPES.some((t2) => this._annoList(t2).some((p) => this._isDraggable(p)));
  }
  _wire() {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("mounted", this._onRerender);
    this.ctx.addEventListener("updated", this._onRerender);
  }
  /**
   * A full (re)render rebuilds the SVG and may swap the annotations config
   * (updateOptions, undo restore), so an open editor card points at stale
   * state: drop it (without committing) before rebinding handlers. Targeted
   * redraws call _attach() directly and keep the card open.
   */
  _onRerender() {
    this._closeEditor(false);
    this._attach();
    if (this._creating) {
      const svg = this.w.dom.Paper && this.w.dom.Paper.node;
      if (svg) {
        svg.style.cursor = "crosshair";
        svg.addEventListener("click", this._onCreateClick, true);
      }
    }
  }
  /**
   * After each (re)render, bind drag + edit handlers to every draggable
   * annotation's elements. Idempotent via a per-node flag so a targeted redraw
   * re-runs this without double-binding the untouched annotations.
   */
  _attach() {
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    TYPES.forEach((type) => {
      this._annoList(type).forEach((anno, index) => {
        if (!this._isDraggable(anno)) return;
        if (!anno.id) {
          anno.id = "apexcharts-ink-" + type + "-" + index + "-" + w.globals.chartID;
        }
        baseEl.querySelectorAll("." + anno.id).forEach((el) => {
          if (el.__inkBound) return;
          el.__inkBound = true;
          el.style.cursor = "move";
          el.classList.add(DRAG_CLASS);
          el.addEventListener(
            "mousedown",
            (e2) => this._onDown(e2, type, index)
          );
          el.addEventListener(
            "touchstart",
            (e2) => this._onDown(e2, type, index)
          );
          el.addEventListener("dblclick", (e2) => {
            e2.preventDefault();
            e2.stopPropagation();
            this._startEdit(type, index, { select: true });
          });
        });
      });
    });
    if (this._paletteEnabled()) this._renderPalette();
  }
  // ─── drag / resize ────────────────────────────────────────────────────────
  /**
   * @param {any} e @param {string} type @param {number} index
   */
  _onDown(e2, type, index) {
    if (e2.button && e2.button !== 0) return;
    const w = this.w;
    const doc = w.dom.baseEl && w.dom.baseEl.ownerDocument;
    if (!doc) return;
    e2.stopPropagation();
    if (e2.cancelable) e2.preventDefault();
    const isTouch = e2.type === "touchstart";
    const ev = isTouch ? e2.touches[0] : e2;
    const svgRoot = w.dom.Paper && w.dom.Paper.node;
    const ctm = svgRoot && svgRoot.getScreenCTM ? svgRoot.getScreenCTM() : null;
    const anno = this._annoList(type)[index];
    let mode = "move";
    let rect = null;
    let origX = 0;
    let origW = 0;
    if (type === "xaxis" && anno.x2 != null) {
      rect = w.dom.baseEl.querySelector(".apexcharts-annotation-rect." + anno.id);
      if (rect) {
        const r2 = rect.getBoundingClientRect();
        if (Math.abs(ev.clientX - r2.left) <= EDGE_PX) mode = "resize-x1";
        else if (Math.abs(ev.clientX - r2.right) <= EDGE_PX) mode = "resize-x2";
        origX = parseFloat(rect.getAttribute("x")) || 0;
        origW = parseFloat(rect.getAttribute("width")) || 0;
      }
    }
    this._drag = {
      type,
      index,
      anno,
      els: Array.from(w.dom.baseEl.querySelectorAll("." + anno.id)),
      mode,
      rect,
      origX,
      origW,
      startX: ev.clientX,
      startY: ev.clientY,
      scaleX: ctm && ctm.a ? ctm.a : 1,
      scaleY: ctm && ctm.d ? ctm.d : 1,
      dxPixel: 0,
      dyPixel: 0,
      moved: false
    };
    doc.addEventListener("mousemove", this._onMove);
    doc.addEventListener("touchmove", this._onMove, { passive: false });
    doc.addEventListener("mouseup", this._onUp);
    doc.addEventListener("touchend", this._onUp);
  }
  /** @param {any} me */
  _onMove(me) {
    const d = this._drag;
    if (!d) return;
    if (me.cancelable) me.preventDefault();
    const mev = me.type === "touchmove" ? me.touches[0] : me;
    d.dxPixel = (mev.clientX - d.startX) / d.scaleX;
    d.dyPixel = (mev.clientY - d.startY) / d.scaleY;
    if (Math.abs(d.dxPixel) > CLICK_SLOP_PX || Math.abs(d.dyPixel) > CLICK_SLOP_PX) {
      d.moved = true;
    }
    if (d.mode === "move") {
      const t2 = `translate(${d.dxPixel} ${d.dyPixel})`;
      d.els.forEach((el) => el.setAttribute("transform", t2));
    } else if (d.rect) {
      if (d.mode === "resize-x1") {
        d.rect.setAttribute("x", d.origX + d.dxPixel);
        d.rect.setAttribute("width", Math.max(1, d.origW - d.dxPixel));
      } else if (d.mode === "resize-x2") {
        d.rect.setAttribute("width", Math.max(1, d.origW + d.dxPixel));
      }
    }
  }
  _onUp() {
    const d = this._drag;
    this._drag = null;
    this._teardownDocListeners();
    if (!d || !d.moved) {
      if (d) {
        d.els.forEach((el) => el.removeAttribute("transform"));
        this._startEdit(d.type, d.index);
      }
      return;
    }
    const anno = this._annoList(d.type)[d.index];
    if (!anno) return;
    this._applyDelta(d, anno);
    d.els.forEach((el) => el.removeAttribute("transform"));
    this._redrawAnno(d.type, anno, d.index);
    this._checkpoint("ink:drag");
    this._fireDragged(d.type, anno, d.index);
  }
  /**
   * Record a Rewind (undo) checkpoint for an ink edit. Targeted redraws fire no
   * 'updated' event, so History would otherwise miss them. No-op when the
   * history feature is absent or disabled.
   * @param {string} label
   */
  _checkpoint(label) {
    var _a, _b;
    (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, label);
  }
  /**
   * Mutate the annotation's config from the pixel drag delta (type + mode aware).
   * @param {any} d @param {any} anno
   */
  _applyDelta(d, anno) {
    const w = this.w;
    const dxData = w.layout.gridWidth ? d.dxPixel * (w.globals.xRange / w.layout.gridWidth) : 0;
    if (d.type === "point") {
      const { newX, newY } = this._invertPoint(anno, d.dxPixel, d.dyPixel);
      anno.x = this._snapX(newX);
      if (newY != null) {
        const yi = anno.yAxisIndex || 0;
        const map = w.globals.seriesYAxisMap;
        anno.y = this._snapY(newY, map && map[yi] ? map[yi][0] : 0);
      }
      return;
    }
    if (d.type === "xaxis") {
      if (typeof anno.x !== "number") return;
      if (d.mode === "move") {
        if (typeof anno.x2 === "number") {
          anno.x += dxData;
          anno.x2 += dxData;
        } else {
          anno.x = this._snapX(anno.x + dxData);
        }
      } else if (d.mode === "resize-x1" || d.mode === "resize-x2") {
        const xIsLeft = anno.x2 == null || anno.x <= anno.x2;
        const grow = d.mode === "resize-x2" ? !xIsLeft : xIsLeft;
        if (grow) anno.x = this._snapX(anno.x + dxData);
        else if (typeof anno.x2 === "number") anno.x2 = this._snapX(anno.x2 + dxData);
      }
      return;
    }
    if (d.type === "yaxis") {
      const yi = anno.yAxisIndex || 0;
      const map = w.globals.seriesYAxisMap;
      const si = map && map[yi] ? map[yi][0] : 0;
      const yRange = w.globals.yRange ? w.globals.yRange[si] : null;
      if (yRange == null || !w.layout.gridHeight) return;
      const dyData = -d.dyPixel * (yRange / w.layout.gridHeight);
      if (typeof anno.y2 === "number") {
        if (typeof anno.y === "number") anno.y += dyData;
        anno.y2 += dyData;
      } else if (typeof anno.y === "number") {
        anno.y = this._snapY(anno.y + dyData, si);
      }
    }
  }
  /**
   * Invert a pixel drag delta to a point annotation's data x/y.
   * @param {any} anno @param {number} dxPixel @param {number} dyPixel
   * @returns {{newX:any, newY:any}}
   */
  _invertPoint(anno, dxPixel, dyPixel) {
    const w = this.w;
    const categoryX = (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !w.axisFlags.dataFormatXNumeric;
    let newX = anno.x;
    if (!categoryX && typeof anno.x === "number" && w.layout.gridWidth) {
      newX = anno.x + dxPixel * (w.globals.xRange / w.layout.gridWidth);
    }
    let newY = anno.y;
    const yi = anno.yAxisIndex || 0;
    const map = w.globals.seriesYAxisMap;
    const si = map && map[yi] ? map[yi][0] : 0;
    const yRange = w.globals.yRange ? w.globals.yRange[si] : null;
    const logY = w.config.yaxis[yi] && w.config.yaxis[yi].logarithmic;
    if (typeof anno.y === "number" && yRange != null && !logY && w.layout.gridHeight) {
      newY = anno.y - dyPixel * (yRange / w.layout.gridHeight);
    }
    return { newX, newY };
  }
  /**
   * Targeted redraw of one annotation: drop its elements and re-add the shape +
   * label + label background at the current config coordinates (no full chart
   * re-render, and repeat-safe unlike updateOptions({})).
   * @param {string} type @param {any} anno @param {number} index
   */
  _redrawAnno(type, anno, index) {
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const annotations = this.ctx.annotations;
    if (!baseEl || !annotations) return;
    baseEl.querySelectorAll("." + anno.id).forEach((el) => el.remove());
    const group = baseEl.querySelector(".apexcharts-" + type + "-annotations");
    if (!group) return;
    if (type === "point" && annotations.pointsAnnotations) {
      annotations.pointsAnnotations.addPointAnnotation(anno, group, index);
    } else if (type === "xaxis" && annotations.xAxisAnnotations) {
      annotations.xAxisAnnotations.addXaxisAnnotation(anno, group, index);
    } else if (type === "yaxis" && annotations.yAxisAnnotations) {
      annotations.yAxisAnnotations.addYaxisAnnotation(anno, group, index);
    }
    const labelEl = baseEl.querySelector(
      ".apexcharts-" + type + "-annotation-label." + anno.id
    );
    if (labelEl && annotations.helpers && anno.label && anno.label.text) {
      const elRect = annotations.helpers.addBackgroundToAnno(labelEl, anno);
      if (elRect && labelEl.parentNode) {
        labelEl.parentNode.insertBefore(elRect.node, labelEl);
      }
    }
    this._attach();
  }
  /**
   * Dispatch an ink annotation lifecycle event both to the user callback
   * (`chart.events[name]`) and the internal event bus, in that order.
   * @param {string} name @param {any} args
   */
  _fireAnnotationEvent(name, args) {
    var _a;
    const events = this.w.config.chart.events;
    if (typeof events[name] === "function") {
      events[name](this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent(name, [this.ctx, args]);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDragged(type, anno, index) {
    const args = { type, id: anno.id, index, x: anno.x, y: anno.y };
    if (anno.x2 != null) args.x2 = anno.x2;
    if (anno.y2 != null) args.y2 = anno.y2;
    this._fireAnnotationEvent("annotationDragged", args);
  }
  // ─── P3: click-to-create ─────────────────────────────────────────────────
  /**
   * Enter create mode: the next click on the plot area drops a new draggable
   * point annotation there and opens its label editor.
   */
  startCreate() {
    if (this._creating) return;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (!svg) return;
    this._creating = true;
    svg.style.cursor = "crosshair";
    svg.addEventListener("click", this._onCreateClick, true);
    this._syncPalette();
  }
  /** Leave create mode. */
  stopCreate() {
    if (!this._creating) return;
    this._creating = false;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (svg) {
      svg.style.cursor = "";
      svg.removeEventListener("click", this._onCreateClick, true);
    }
    this._syncPalette();
  }
  /** @param {any} e */
  _onCreateClick(e2) {
    if (!this._creating) return;
    e2.preventDefault();
    e2.stopPropagation();
    const pos = this._pixelToData(e2.clientX, e2.clientY);
    this.stopCreate();
    if (!pos) return;
    this.createAt(pos.x, pos.y);
  }
  /**
   * Create a draggable note at data coordinates and open its editor card.
   * Public: the context menu's "Add note here" routes here so its notes are
   * config-backed too, and thus draggable, editable, persistable and undoable.
   * @param {any} x @param {any} y @param {{text?: string}} [opts]
   * @returns {any} the created annotation config
   */
  createAt(x, y, opts = {}) {
    const w = this.w;
    this._wire();
    this._createSeq += 1;
    const id = "apexcharts-ink-new-" + this._createSeq + "-" + w.globals.chartID;
    const anno = Utils.extend(new Options().pointAnnotation, {
      x,
      y,
      id,
      draggable: true,
      label: { text: opts.text || "Note" }
    });
    if (!w.config.annotations) w.config.annotations = {};
    if (!Array.isArray(w.config.annotations.points)) w.config.annotations.points = [];
    w.config.annotations.points.push(anno);
    const index = w.config.annotations.points.length - 1;
    this._redrawAnno("point", anno, index);
    this._checkpoint("ink:create");
    this._fireCreated("point", anno, index);
    this._startEdit("point", index, { select: true });
    return anno;
  }
  /**
   * Create a draggable dashed LINE annotation at a data value and open its
   * editor card: axis 'x' drops a vertical line at a data x, axis 'y' a
   * horizontal line at a data y. Public: the context menu's "Annotate here"
   * routes here so its lines are config-backed too, and thus draggable,
   * editable, persistable and undoable. Lines only: x2/y2 are never set, so
   * this can never produce a range rectangle.
   * @param {'x'|'y'} axis @param {any} val
   * @param {{text?: string, strokeDashArray?: number, color?: string, select?: boolean}} [opts]
   * @returns {any} the created annotation config
   */
  createLineAt(axis, val, opts = {}) {
    const w = this.w;
    this._wire();
    this._createSeq += 1;
    const id = "apexcharts-ink-new-" + this._createSeq + "-" + w.globals.chartID;
    const type = axis === "y" ? "yaxis" : "xaxis";
    const defaults = type === "yaxis" ? new Options().yAxisAnnotation : new Options().xAxisAnnotation;
    const over = {
      id,
      draggable: true,
      strokeDashArray: opts.strokeDashArray != null ? opts.strokeDashArray : 4,
      label: { text: opts.text || "" }
    };
    if (opts.color) {
      over.borderColor = opts.color;
      over.label.borderColor = opts.color;
    }
    if (type === "yaxis") over.y = val;
    else over.x = val;
    const anno = Utils.extend(defaults, over);
    if (!w.config.annotations) w.config.annotations = {};
    if (!Array.isArray(w.config.annotations[type])) w.config.annotations[type] = [];
    w.config.annotations[type].push(anno);
    const index = w.config.annotations[type].length - 1;
    this._redrawAnno(type, anno, index);
    this._checkpoint("ink:create");
    this._fireCreated(type, anno, index);
    if (opts.select !== false) this._startEdit(type, index, { select: true });
    return anno;
  }
  /**
   * Convert a client-space point to data coordinates (absolute, for create).
   * @param {number} clientX @param {number} clientY
   * @returns {{x:any, y:any}|null}
   */
  _pixelToData(clientX, clientY) {
    const w = this.w;
    const gridEl = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!gridEl) return null;
    const g = gridEl.getBoundingClientRect();
    if (!g.width || !g.height) return null;
    const fx = (clientX - g.left) / g.width;
    const fy = (clientY - g.top) / g.height;
    const minX = w.globals.minX;
    const xRange = w.globals.xRange;
    const minY = w.globals.minYArr && w.globals.minYArr[0] != null ? w.globals.minYArr[0] : w.globals.minY;
    const yRange = w.globals.yRange && w.globals.yRange[0] != null ? w.globals.yRange[0] : w.globals.maxY - w.globals.minY;
    let x = minX + fx * xRange;
    const y = minY + (1 - fy) * yRange;
    const categoryX = (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !w.axisFlags.dataFormatXNumeric;
    if (categoryX) x = Math.round(x);
    return { x, y };
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireCreated(type, anno, index) {
    const args = { type, id: anno.id, index };
    if (typeof anno.x !== "undefined") args.x = anno.x;
    if (typeof anno.y !== "undefined") args.y = anno.y;
    this._fireAnnotationEvent("annotationCreated", args);
  }
  // ─── P3: tool palette ────────────────────────────────────────────────────
  /** Render a minimal "add note" toggle into the chart wrap (once per render). */
  _renderPalette() {
    const w = this.w;
    const elWrap = w.dom.elWrap;
    if (!elWrap || elWrap.querySelector(".apexcharts-ink-palette")) return;
    const doc = elWrap.ownerDocument;
    const bar = doc.createElement("div");
    bar.className = "apexcharts-ink-palette";
    const s2 = bar.style;
    s2.position = "absolute";
    s2.top = "6px";
    s2.left = "6px";
    s2.zIndex = "15";
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "apexcharts-ink-add";
    btn.textContent = "+ Note";
    const bs = btn.style;
    bs.cursor = "pointer";
    bs.font = "12px sans-serif";
    bs.padding = "4px 9px";
    bs.borderRadius = "5px";
    bs.border = "1px solid #6366f1";
    bs.color = "#4338ca";
    bs.background = "#fff";
    btn.addEventListener("click", (e2) => {
      e2.stopPropagation();
      if (this._creating) this.stopCreate();
      else this.startCreate();
    });
    bar.appendChild(btn);
    elWrap.appendChild(bar);
    this._syncPalette();
  }
  /** Reflect create-mode state on the palette button. */
  _syncPalette() {
    const elWrap = this.w.dom.elWrap;
    const btn = (
      /** @type {any} */
      elWrap && elWrap.querySelector(".apexcharts-ink-add")
    );
    if (!btn) return;
    if (this._creating) {
      btn.style.background = "#6366f1";
      btn.style.color = "#fff";
      btn.textContent = "Click chart...";
    } else {
      btn.style.background = "#fff";
      btn.style.color = "#4338ca";
      btn.textContent = "+ Note";
    }
  }
  // ─── P2 + P6: the floating note editor card ──────────────────────────────
  // Click (or double-click) an ink-managed annotation to open a small card
  // anchored to it: rename inline, recolor via accent swatches, toggle bold,
  // step the font size, size/reshape the marker (points), or delete the note.
  /** @returns {string[]} the accent swatches offered by the editor */
  _noteColors() {
    const ink = this.w.config.chart.ink;
    return ink && Array.isArray(ink.noteColors) && ink.noteColors.length ? ink.noteColors : NOTE_COLORS;
  }
  /**
   * Perceived-luminance check so text/border contrast follows the accent.
   * @param {string} hex
   */
  static _isLight(hex) {
    const h2 = String(hex || "").replace("#", "");
    const full = h2.length === 3 ? h2.split("").map((c2) => c2 + c2).join("") : h2;
    const n2 = parseInt(full, 16);
    if (isNaN(n2) || full.length !== 6) return false;
    const r2 = n2 >> 16 & 255;
    const g = n2 >> 8 & 255;
    const b = n2 & 255;
    return (0.299 * r2 + 0.587 * g + 0.114 * b) / 255 > 0.72;
  }
  /** @param {any} style */
  static _isBold(style) {
    const fw = style && style.fontWeight;
    return fw === "bold" || parseInt(String(fw), 10) >= 600;
  }
  /**
   * Small icon/text button for the editor card. mousedown is prevented so the
   * text input keeps focus while formatting.
   * @param {any} doc @param {string} content @param {string} title
   * @param {Function} onClick @param {string} [extraClass] @param {boolean} [isSvg]
   */
  _cardBtn(doc, content, title, onClick, extraClass, isSvg) {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "apexcharts-ink-btn" + (extraClass ? " " + extraClass : "");
    b.title = title;
    b.setAttribute("aria-label", title);
    if (isSvg) b.innerHTML = content;
    else b.textContent = content;
    b.addEventListener("mousedown", (e2) => e2.preventDefault());
    b.addEventListener("click", (e2) => {
      e2.stopPropagation();
      onClick();
    });
    return b;
  }
  /**
   * Uppercase row caption ("Label" / "Line" / "Marker") for the editor card.
   * @param {any} doc @param {string} text
   */
  _cardLabel(doc, text) {
    const lab = doc.createElement("span");
    lab.className = "apexcharts-ink-cardlabel";
    lab.textContent = text;
    return lab;
  }
  /**
   * Color swatch button for the editor card. mousedown is prevented so the
   * text input keeps focus while restyling.
   * @param {any} doc @param {string} c
   * @param {(c: string) => void} pick @param {string} [extraClass]
   */
  _mkSwatch(doc, c2, pick, extraClass) {
    const sw = doc.createElement("button");
    sw.type = "button";
    sw.className = "apexcharts-ink-swatch" + (extraClass ? " " + extraClass : "");
    sw.title = c2;
    sw.setAttribute("aria-label", "Color " + c2);
    sw.dataset.color = c2;
    sw.style.background = c2;
    sw.addEventListener("mousedown", (e2) => e2.preventDefault());
    sw.addEventListener("click", (e2) => {
      e2.stopPropagation();
      pick(c2);
    });
    return sw;
  }
  /**
   * Open the floating editor card for an annotation.
   * @param {string} type @param {number} index
   * @param {{select?: boolean}} [opts] select: preselect the text (create / dblclick)
   */
  _startEdit(type, index, opts = {}) {
    const w = this.w;
    const anno = this._annoList(type)[index];
    const baseEl = w.dom.baseEl;
    const elWrap = w.dom.elWrap;
    if (!anno || !anno.id || !baseEl || !elWrap) return;
    this._closeEditor(false);
    const doc = baseEl.ownerDocument;
    const card = doc.createElement("div");
    card.className = "apexcharts-ink-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Edit note");
    card.style.visibility = "hidden";
    const rowText = doc.createElement("div");
    rowText.className = "apexcharts-ink-card-row";
    const input = doc.createElement("input");
    input.type = "text";
    input.className = "apexcharts-ink-editor";
    input.placeholder = "Note text";
    input.value = anno.label && anno.label.text || "";
    rowText.appendChild(input);
    rowText.appendChild(
      this._cardBtn(
        doc,
        TRASH_ICON,
        "Delete note",
        () => this._deleteAnno(),
        "apexcharts-ink-btn--delete",
        true
      )
    );
    card.appendChild(rowText);
    const rowStyle = doc.createElement("div");
    rowStyle.className = "apexcharts-ink-card-row";
    if (type !== "point") {
      rowStyle.appendChild(this._cardLabel(doc, "Label"));
    }
    this._noteColors().forEach((c2) => {
      rowStyle.appendChild(this._mkSwatch(doc, c2, (col) => this._applyColor(col)));
    });
    const sep = doc.createElement("span");
    sep.className = "apexcharts-ink-sep";
    rowStyle.appendChild(sep);
    rowStyle.appendChild(
      this._cardBtn(doc, "B", "Bold", () => this._toggleBold(), "apexcharts-ink-btn--bold")
    );
    rowStyle.appendChild(this._cardBtn(doc, "A-", "Smaller text", () => this._stepFont(-1)));
    rowStyle.appendChild(this._cardBtn(doc, "A+", "Larger text", () => this._stepFont(1)));
    card.appendChild(rowStyle);
    if (type !== "point") {
      const rowLine = doc.createElement("div");
      rowLine.className = "apexcharts-ink-card-row";
      rowLine.appendChild(this._cardLabel(doc, "Line"));
      this._noteColors().forEach((c2) => {
        rowLine.appendChild(
          this._mkSwatch(
            doc,
            c2,
            (col) => this._applyLineColor(col),
            "apexcharts-ink-swatch--line"
          )
        );
      });
      card.appendChild(rowLine);
    }
    if (type === "point") {
      const rowMarker = doc.createElement("div");
      rowMarker.className = "apexcharts-ink-card-row";
      rowMarker.appendChild(this._cardLabel(doc, "Marker"));
      rowMarker.appendChild(
        this._cardBtn(doc, "-", "Smaller marker", () => this._stepMarker(-1))
      );
      const sizeOut = doc.createElement("span");
      sizeOut.className = "apexcharts-ink-marker-size";
      rowMarker.appendChild(sizeOut);
      rowMarker.appendChild(
        this._cardBtn(doc, "+", "Larger marker", () => this._stepMarker(1))
      );
      rowMarker.appendChild(
        this._cardBtn(
          doc,
          SHAPE_GLYPHS.circle,
          "Marker shape",
          () => this._cycleShape(),
          "apexcharts-ink-btn--shape"
        )
      );
      card.appendChild(rowMarker);
    }
    elWrap.appendChild(card);
    this._editor = { card, input, type, index };
    this._positionCard();
    this._syncCard();
    card.style.visibility = "";
    input.focus();
    if (opts.select) input.select();
    card.addEventListener("keydown", (e2) => {
      if (e2.key === "Escape") {
        e2.preventDefault();
        e2.stopPropagation();
        this._closeEditor(false);
      } else if (e2.key === "Enter" && e2.target === input) {
        e2.preventDefault();
        this._closeEditor(true);
      }
    });
    doc.addEventListener("mousedown", this._onDocDownEditor, true);
    doc.addEventListener("touchstart", this._onDocDownEditor, true);
  }
  /**
   * Commit + close on any press outside the card.
   * @param {any} e
   */
  _onDocDownEditor(e2) {
    const ed = this._editor;
    if (!ed || ed.card.contains(e2.target)) return;
    this._closeEditor(true);
  }
  /**
   * Anchor the card to the annotation's label (below it, or above when there
   * is no room), clamped inside the chart wrap. Re-run after each restyle
   * since the label rect changes.
   */
  _positionCard() {
    const ed = this._editor;
    if (!ed) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const elWrap = w.dom.elWrap;
    const anno = this._annoList(ed.type)[ed.index];
    if (!baseEl || !elWrap || !anno) return;
    const anchor = baseEl.querySelector(
      ".apexcharts-" + ed.type + "-annotation-label." + anno.id
    ) || baseEl.querySelector("." + anno.id);
    if (!anchor) return;
    const wrapRect = elWrap.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    const cw = ed.card.offsetWidth;
    const ch = ed.card.offsetHeight;
    let left = Math.round(aRect.left - wrapRect.left);
    let top = Math.round(aRect.bottom - wrapRect.top) + 8;
    if (top + ch > elWrap.clientHeight - 4) {
      top = Math.round(aRect.top - wrapRect.top) - ch - 8;
    }
    if (left + cw > elWrap.clientWidth - 4) left = elWrap.clientWidth - cw - 4;
    ed.card.style.left = Math.max(4, left) + "px";
    ed.card.style.top = Math.max(4, top) + "px";
  }
  /** Reflect the annotation's current style on the card controls. */
  _syncCard() {
    const ed = this._editor;
    if (!ed) return;
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    const style = anno.label && anno.label.style || {};
    const bg = String(style.background || "").toLowerCase();
    ed.card.querySelectorAll(".apexcharts-ink-swatch:not(.apexcharts-ink-swatch--line)").forEach((sw) => {
      sw.classList.toggle(
        "apexcharts-ink-swatch--active",
        (sw.dataset.color || "").toLowerCase() === bg
      );
    });
    const stroke = String(anno.borderColor || "").toLowerCase();
    ed.card.querySelectorAll(".apexcharts-ink-swatch--line").forEach((sw) => {
      sw.classList.toggle(
        "apexcharts-ink-swatch--active",
        (sw.dataset.color || "").toLowerCase() === stroke
      );
    });
    const boldBtn = ed.card.querySelector(".apexcharts-ink-btn--bold");
    if (boldBtn) {
      boldBtn.classList.toggle("apexcharts-ink-btn--active", InkLayer._isBold(style));
    }
    const m = anno.marker || {};
    const sizeOut = ed.card.querySelector(".apexcharts-ink-marker-size");
    if (sizeOut) {
      sizeOut.textContent = String(typeof m.size === "number" ? m.size : 4);
    }
    const shapeBtn = ed.card.querySelector(".apexcharts-ink-btn--shape");
    if (shapeBtn) {
      shapeBtn.textContent = SHAPE_GLYPHS[m.shape] || SHAPE_GLYPHS.circle;
    }
  }
  /**
   * Commit the input's text into the annotation (the card stays open). Also
   * runs before any style apply so typed-but-unconfirmed text survives the
   * redraw.
   * @param {any} ed
   */
  _commitTextOf(ed) {
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    const text = ed.input.value;
    if (!anno.label) anno.label = {};
    if (anno.label.text === text) return;
    anno.label.text = text;
    this._redrawAnno(ed.type, anno, ed.index);
    this._checkpoint("ink:edit");
    this._fireEdited(ed.type, anno, ed.index);
  }
  /**
   * Close the editor card. commit=true also commits the pending text. Style
   * edits apply immediately and are not rolled back by Escape; use undo.
   * @param {boolean} commit
   */
  _closeEditor(commit) {
    const ed = this._editor;
    if (!ed) return;
    this._editor = null;
    const doc = this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
    if (doc) {
      doc.removeEventListener("mousedown", this._onDocDownEditor, true);
      doc.removeEventListener("touchstart", this._onDocDownEditor, true);
    }
    if (ed.card.parentNode) ed.card.parentNode.removeChild(ed.card);
    if (commit) this._commitTextOf(ed);
  }
  /**
   * Apply a config mutation from a card control: commit pending text, mutate,
   * redraw, checkpoint for undo, then refresh + re-anchor the card.
   * @param {string} label @param {(anno: any) => void} mutate
   */
  _applyStyle(label, mutate) {
    const ed = this._editor;
    if (!ed) return;
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    this._commitTextOf(ed);
    if (!anno.label) anno.label = {};
    if (!anno.label.style) anno.label.style = {};
    mutate(anno);
    this._redrawAnno(ed.type, anno, ed.index);
    this._checkpoint(label);
    this._fireStyled(ed.type, anno, ed.index);
    this._syncCard();
    this._positionCard();
  }
  /**
   * Apply an accent color: label chip + marker (points) or line/range fill
   * (axis annotations), with text/border contrast following the luminance.
   * @param {string} c
   */
  _applyColor(c2) {
    const ed = this._editor;
    if (!ed) return;
    const light = InkLayer._isLight(c2);
    this._applyStyle("ink:style", (anno) => {
      anno.label.style.background = c2;
      anno.label.style.color = light ? "#334155" : "#ffffff";
      anno.label.borderColor = light ? "#cbd5e1" : c2;
      if (ed.type === "point") {
        if (!anno.marker) anno.marker = {};
        anno.marker.strokeColor = light ? "#334155" : c2;
        anno.marker.fillColor = light ? "#ffffff" : c2;
      }
    });
  }
  /**
   * Line-stroke color for axis annotations, separate from the label chip.
   * @param {string} c
   */
  _applyLineColor(c2) {
    const ed = this._editor;
    if (!ed || ed.type === "point") return;
    this._applyStyle("ink:style", (anno) => {
      anno.borderColor = c2;
      if (anno.x2 != null || anno.y2 != null) anno.fillColor = c2;
    });
  }
  /**
   * Step the label font size through the preset scale.
   * @param {number} dir
   */
  _stepFont(dir) {
    this._applyStyle("ink:style", (anno) => {
      const cur = parseFloat(anno.label.style.fontSize) || 11;
      let i2 = 0;
      for (let k = 1; k < FONT_STEPS.length; k++) {
        if (Math.abs(FONT_STEPS[k] - cur) < Math.abs(FONT_STEPS[i2] - cur)) i2 = k;
      }
      i2 = Math.min(FONT_STEPS.length - 1, Math.max(0, i2 + dir));
      anno.label.style.fontSize = FONT_STEPS[i2] + "px";
    });
  }
  _toggleBold() {
    this._applyStyle("ink:style", (anno) => {
      anno.label.style.fontWeight = InkLayer._isBold(anno.label.style) ? 400 : 700;
    });
  }
  /**
   * Grow/shrink the point marker.
   * @param {number} dir
   */
  _stepMarker(dir) {
    this._applyStyle("ink:style", (anno) => {
      if (!anno.marker) anno.marker = {};
      const cur = typeof anno.marker.size === "number" ? anno.marker.size : 4;
      anno.marker.size = Math.min(14, Math.max(2, cur + dir));
    });
  }
  /** Cycle the point marker shape (circle, square, diamond, triangle). */
  _cycleShape() {
    this._applyStyle("ink:style", (anno) => {
      if (!anno.marker) anno.marker = {};
      const i2 = MARKER_SHAPES.indexOf(anno.marker.shape);
      anno.marker.shape = MARKER_SHAPES[(i2 + 1) % MARKER_SHAPES.length];
    });
  }
  /** Delete the annotation the editor is open on (undoable via Rewind). */
  _deleteAnno() {
    const ed = this._editor;
    if (!ed) return;
    const list = this._annoList(ed.type);
    const anno = list[ed.index];
    this._closeEditor(false);
    if (!anno) return;
    const baseEl = this.w.dom.baseEl;
    if (baseEl && anno.id) {
      baseEl.querySelectorAll("." + anno.id).forEach((el) => el.remove());
    }
    list.splice(ed.index, 1);
    for (let i2 = ed.index; i2 < list.length; i2++) {
      this._redrawAnno(ed.type, list[i2], i2);
    }
    this._checkpoint("ink:delete");
    this._fireDeleted(ed.type, anno, ed.index);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireEdited(type, anno, index) {
    const args = { type, id: anno.id, index, text: anno.label ? anno.label.text : "" };
    this._fireAnnotationEvent("annotationEdited", args);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireStyled(type, anno, index) {
    const args = { type, id: anno.id, index, label: anno.label, marker: anno.marker };
    this._fireAnnotationEvent("annotationStyled", args);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDeleted(type, anno, index) {
    const args = { type, id: anno.id, index };
    this._fireAnnotationEvent("annotationDeleted", args);
  }
  // ─── lifecycle ────────────────────────────────────────────────────────────
  _teardownDocListeners() {
    const doc = this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
    if (!doc) return;
    doc.removeEventListener("mousemove", this._onMove);
    doc.removeEventListener("touchmove", this._onMove);
    doc.removeEventListener("mouseup", this._onUp);
    doc.removeEventListener("touchend", this._onUp);
  }
  teardown() {
    var _a, _b, _c, _d;
    this._teardownDocListeners();
    this._closeEditor(false);
    this.stopCreate();
    this._drag = null;
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "mounted", this._onRerender);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "updated", this._onRerender);
      this._wired = false;
    }
  }
}
ApexCharts__default.registerFeatures({ ink: InkLayer });
class Measure {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.graphics = new Graphics(w);
    this.pins = [];
    this.drag = null;
    this.armed = false;
    this.persistent = false;
    this.pane = null;
    this._seedActive = false;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onSeedDown = this._onSeedDown.bind(this);
    this._onSeedKey = this._onSeedKey.bind(this);
    this._afterRender = this._afterRender.bind(this);
    ctx.addEventListener("mounted", this._afterRender);
    ctx.addEventListener("updated", this._afterRender);
    this._bindKeys();
  }
  _cfg() {
    return this.w.config.chart.measure || {};
  }
  _enabled() {
    return this.w.globals.axisCharts && this._cfg().enabled === true;
  }
  _mode() {
    return this._cfg().mode === "free" ? "free" : "span";
  }
  /**
   * Nearest first-series data point to a data x (used to snap span endpoints
   * onto the series line).
   * @param {number} dataX
   * @returns {{x:number,y:number}|null}
   */
  _snapToSeries(dataX) {
    const s0 = (
      /** @type {any} */
      (this.w.config.series || [])[0]
    );
    if (!s0) return null;
    const pts = this._points(s0.data || []);
    if (!pts.length) return null;
    let best = pts[0];
    let bd = Math.abs(pts[0].x - dataX);
    for (let i2 = 1; i2 < pts.length; i2++) {
      const d = Math.abs(pts[i2].x - dataX);
      if (d < bd) {
        bd = d;
        best = pts[i2];
      }
    }
    return best;
  }
  /**
   * Resolve a raw projected point to the endpoint that is actually drawn: span
   * mode snaps x to the nearest first-series data point (y follows the line);
   * free mode keeps the raw point.
   * @param {{x:number,y:number,gx:number,gy:number}} raw
   */
  _resolve(raw) {
    if (this._mode() === "free") return raw;
    const snapped = this._snapToSeries(raw.x);
    if (!snapped) return raw;
    const g = this._dataToGrid(snapped.x, snapped.y);
    return { x: snapped.x, y: snapped.y, gx: g.gx, gy: g.gy };
  }
  _doc() {
    return this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
  }
  /** Bind the measure-key listeners once on the owner document. */
  _bindKeys() {
    if (this._keysBound) return;
    const doc = this._doc();
    if (!doc) return;
    doc.addEventListener("keydown", this._onKeyDown);
    doc.addEventListener("keyup", this._onKeyUp);
    this._keysBound = true;
  }
  /** @param {any} e */
  _onKeyDown(e2) {
    if (!this._enabled() || this.persistent) return;
    const key = this._cfg().key || "m";
    if (e2.key && e2.key.toLowerCase() === String(key).toLowerCase()) {
      this._arm();
    } else if (e2.key === "Escape") {
      this._cancelDrag();
    }
  }
  /** @param {any} e */
  _onKeyUp(e2) {
    if (this.persistent) return;
    const key = this._cfg().key || "m";
    if (e2.key && e2.key.toLowerCase() === String(key).toLowerCase()) {
      if (!this.drag) this._disarm();
    }
  }
  /** Public: arm a sticky measure mode (survives key release) until stopped. */
  startMeasure() {
    if (!this._enabled()) return;
    this.persistent = true;
    this._arm();
  }
  /** Public: leave measure mode. */
  stopMeasure() {
    this.persistent = false;
    this._cancelDrag();
    this._disarm();
  }
  /**
   * Public: begin a measurement anchored at a client-space point (used by the
   * context menu's "Measure from here"). Endpoint A is fixed at (cx,cy), the
   * ruler follows the cursor, and the next pointer press sets B and pins it.
   * Escape cancels. No-op unless the measure tool is enabled.
   * @param {number} cx @param {number} cy
   */
  seedFromClient(cx, cy) {
    if (!this._enabled()) return;
    this._cancelDrag();
    this._endSeed(false);
    const a2 = this._project(cx, cy);
    this.drag = { a: a2, b: a2 };
    this._seedActive = true;
    const doc = this._doc();
    if (doc) {
      doc.addEventListener("mousemove", this._onMove);
      doc.addEventListener("touchmove", this._onMove, { passive: false });
      doc.addEventListener("mousedown", this._onSeedDown, true);
      doc.addEventListener("touchstart", this._onSeedDown, true);
      doc.addEventListener("keydown", this._onSeedKey, true);
    }
    this._renderLive();
  }
  /** @param {any} e */
  _onSeedDown(e2) {
    if (!this._seedActive || !this.drag) return;
    e2.preventDefault();
    e2.stopPropagation();
    const { cx, cy } = this._clientXY(e2);
    this.drag.b = this._project(cx, cy);
    this._endSeed(true);
  }
  /** @param {any} e */
  _onSeedKey(e2) {
    if (e2.key === "Escape") this._endSeed(false);
  }
  /**
   * Finish (commit) or cancel a "measure from here" seed and detach listeners.
   * @param {boolean} commit
   */
  _endSeed(commit) {
    var _a, _b;
    if (!this._seedActive) return;
    this._seedActive = false;
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("mousedown", this._onSeedDown, true);
      doc.removeEventListener("touchstart", this._onSeedDown, true);
      doc.removeEventListener("keydown", this._onSeedKey, true);
    }
    const d = this.drag;
    this.drag = null;
    this._clearLive();
    if (!commit || !d) return;
    const a2 = this._resolve(d.a);
    const b = this._resolve(d.b);
    if (Math.abs(a2.gx - b.gx) < 2 && Math.abs(a2.gy - b.gy) < 2) return;
    const mode = this._mode();
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a2.x, ya: a2.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a2, b);
  }
  /** Public: remove all pinned rulers. */
  clearMeasures() {
    var _a, _b;
    this.pins = [];
    this._renderPins();
    (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "clear measures");
  }
  /**
   * Snapshot of the pinned rulers as JSON-safe plain data. This is the piece of
   * state ViewState / Perspectives (shareable URL) / Rewind (undo) persist:
   * pins already live in data space, so they round-trip and re-project.
   * Returns a deep copy so callers cannot mutate ours.
   * @returns {Array<{xa:number,ya:number,xb:number,yb:number,mode:string}>}
   */
  getPins() {
    return this.pins.map((p) => ({
      xa: p.xa,
      ya: p.ya,
      xb: p.xb,
      yb: p.yb,
      mode: p.mode === "free" ? "free" : "span"
    }));
  }
  /**
   * Replace the pinned rulers with a restored set and redraw. Accepts the shape
   * getPins() returns; a nullish / non-array value (or an old token without
   * measure state) clears all pins. Non-finite entries are dropped. Does NOT
   * record a Rewind step (the restore itself is the caller's undo boundary).
   * @param {any} pins
   */
  setPins(pins) {
    this.pins = Array.isArray(pins) ? pins.filter(
      (p) => p && isFinite(p.xa) && isFinite(p.ya) && isFinite(p.xb) && isFinite(p.yb)
    ).map((p) => ({
      xa: +p.xa,
      ya: +p.ya,
      xb: +p.xb,
      yb: +p.yb,
      mode: p.mode === "free" ? "free" : "span"
    })) : [];
    this._renderPins();
  }
  /**
   * Normalize a series `data` array into {x,y} points (numeric/datetime x or
   * category index). Non-finite / non-scalar (range/candle) points drop out.
   * @param {any[]} data
   * @returns {Array<{x:number,y:number}>}
   */
  _points(data) {
    const out = [];
    for (let i2 = 0; i2 < data.length; i2++) {
      const p = data[i2];
      let x;
      let y;
      if (Array.isArray(p)) {
        x = +p[0];
        y = +p[1];
      } else if (p && typeof p === "object") {
        x = +p.x;
        y = +p.y;
      } else {
        x = i2;
        y = +p;
      }
      if (isFinite(x) && isFinite(y)) out.push({ x, y });
    }
    return out;
  }
  /** Lay the transparent capture pane over the plot so our pointer handlers own
   *  the drag (ZoomPanSelection never sees it). */
  _arm() {
    if (this.armed || !this._enabled()) return;
    const w = this.w;
    const parent = w.dom.elGraphical;
    if (!parent) return;
    this.armed = true;
    const pane = this.graphics.drawRect(0, 0, w.layout.gridWidth, w.layout.gridHeight);
    pane.node.setAttribute("class", "apexcharts-measure-capture");
    pane.node.setAttribute("fill", "transparent");
    pane.node.style.cursor = "crosshair";
    pane.node.style.pointerEvents = "all";
    pane.node.addEventListener("mousedown", this._onDown);
    pane.node.addEventListener("touchstart", this._onDown, { passive: false });
    parent.add(pane);
    this.pane = pane;
  }
  _disarm() {
    this.armed = false;
    if (this.pane) {
      this.pane.node.removeEventListener("mousedown", this._onDown);
      this.pane.node.removeEventListener("touchstart", this._onDown);
      const p = this.pane.node;
      if (p.parentNode) p.parentNode.removeChild(p);
      this.pane = null;
    }
  }
  /** @param {any} e @returns {{cx:number,cy:number}} */
  _clientXY(e2) {
    const t2 = e2.touches && e2.touches[0] ? e2.touches[0] : e2;
    return { cx: t2.clientX, cy: t2.clientY };
  }
  _gridRect() {
    const g = this.w.dom.baseEl.querySelector(".apexcharts-grid");
    return g ? g.getBoundingClientRect() : null;
  }
  /** [min,max] for the primary y-axis, preferring the rendered nice scale. */
  _yRange() {
    const g = this.w.globals;
    const s2 = g.yAxisScale && g.yAxisScale[0];
    if (s2 && isFinite(s2.niceMin) && isFinite(s2.niceMax) && s2.niceMax !== s2.niceMin) {
      return [s2.niceMin, s2.niceMax];
    }
    return [g.minY, g.maxY];
  }
  /**
   * Client pixel -> { x, y (data), gx, gy (grid-local SVG units) }.
   * @param {number} cx @param {number} cy
   */
  _project(cx, cy) {
    const w = this.w;
    const rect = this._gridRect();
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = rect ? clamp((cx - rect.left) / rect.width) : 0;
    const fy = rect ? clamp((cy - rect.top) / rect.height) : 0;
    const [ymin, ymax] = this._yRange();
    const x = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const y = ymax - fy * (ymax - ymin);
    return { x, y, gx: fx * gw, gy: fy * gh };
  }
  /**
   * Data (x,y) -> grid-local SVG coords, for redrawing pinned rulers.
   * @param {number} x @param {number} y
   */
  _dataToGrid(x, y) {
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const xr = w.globals.maxX - w.globals.minX || 1;
    const [ymin, ymax] = this._yRange();
    const yr = ymax - ymin || 1;
    return {
      gx: (x - w.globals.minX) / xr * gw,
      gy: gh - (y - ymin) / yr * gh
    };
  }
  /** @param {any} e */
  _onDown(e2) {
    if (!this.armed) return;
    e2.preventDefault();
    e2.stopPropagation();
    const { cx, cy } = this._clientXY(e2);
    const a2 = this._project(cx, cy);
    this.drag = { a: a2, b: a2 };
    const doc = this._doc();
    if (doc) {
      doc.addEventListener("mousemove", this._onMove);
      doc.addEventListener("mouseup", this._onUp);
      doc.addEventListener("touchmove", this._onMove, { passive: false });
      doc.addEventListener("touchend", this._onUp);
    }
    this._renderLive();
  }
  /** @param {any} e */
  _onMove(e2) {
    if (!this.drag) return;
    if (e2.cancelable) e2.preventDefault();
    const { cx, cy } = this._clientXY(e2);
    this.drag.b = this._project(cx, cy);
    this._renderLive();
  }
  /** @param {any} _e */
  _onUp(_e) {
    var _a, _b;
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("mouseup", this._onUp);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("touchend", this._onUp);
    }
    if (!this.drag) return;
    const rawA = this.drag.a;
    const rawB = this.drag.b;
    this.drag = null;
    this._clearLive();
    if (Math.abs(rawA.gx - rawB.gx) < 2 && Math.abs(rawA.gy - rawB.gy) < 2) {
      if (!this.persistent) this._disarm();
      return;
    }
    const mode = this._mode();
    const a2 = this._resolve(rawA);
    const b = this._resolve(rawB);
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a2.x, ya: a2.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a2, b);
    if (!this.persistent) this._disarm();
  }
  _cancelDrag() {
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("mouseup", this._onUp);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("touchend", this._onUp);
    }
    this.drag = null;
    this._clearLive();
  }
  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   * @returns {{dx:number,dy:number,pct:number,slope:number}}
   */
  _stats(a2, b) {
    const dx = b.x - a2.x;
    const dy = b.y - a2.y;
    return {
      dx,
      dy,
      pct: a2.y !== 0 ? dy / Math.abs(a2.y) * 100 : NaN,
      slope: dx !== 0 ? dy / dx : NaN
    };
  }
  /** @param {number} v */
  _fmt(v) {
    if (!isFinite(v)) return "n/a";
    const a2 = Math.abs(v);
    if (a2 !== 0 && (a2 < 0.01 || a2 >= 1e6)) return v.toExponential(2);
    return String(Math.round(v * 100) / 100);
  }
  /** getComputedStyle of the graphical layer (browser only), for CSS vars. */
  _computedStyle() {
    if (!Environment.isBrowser()) return null;
    const node = this.w.dom.elGraphical && this.w.dom.elGraphical.node;
    if (!node || typeof getComputedStyle !== "function") return null;
    try {
      return getComputedStyle(node);
    } catch (e2) {
      return null;
    }
  }
  /**
   * Resolve a color: explicit config value, else a `--apx-measure-*` CSS custom
   * property, else the built-in default.
   * @param {any} cfgVal @param {string} varName @param {string} fallback
   * @param {CSSStyleDeclaration|null} [cs]
   */
  _resolveColor(cfgVal, varName, fallback, cs) {
    if (cfgVal) return cfgVal;
    const style = cs !== void 0 ? cs : this._computedStyle();
    const v = style ? style.getPropertyValue(varName).trim() : "";
    return v || fallback;
  }
  /** Resolved semantic colors (config -> CSS var -> built-in default). */
  _colors() {
    const c2 = this._cfg().colors || {};
    const cs = this._computedStyle();
    return {
      up: this._resolveColor(c2.up, "--apx-measure-up", "#16a34a", cs),
      down: this._resolveColor(c2.down, "--apx-measure-down", "#dc2626", cs),
      neutral: this._resolveColor(c2.neutral, "--apx-measure-neutral", "#64748b", cs),
      guide: this._resolveColor(c2.guide, "--apx-measure-guide", "#94a3b8", cs)
    };
  }
  /** @param {number} dy */
  _dirColor(dy) {
    const c2 = this._colors();
    return dy === 0 ? c2.neutral : dy > 0 ? c2.up : c2.down;
  }
  /** @param {number} dy */
  _dirClass(dy) {
    return dy === 0 ? "apexcharts-measure-flat" : dy > 0 ? "apexcharts-measure-up" : "apexcharts-measure-down";
  }
  /**
   * Format a percentage, via `measure.format.percent` when set.
   * @param {number} p
   */
  _fmtPct(p) {
    if (!isFinite(p)) return "n/a";
    const f = this._cfg().format && this._cfg().format.percent;
    if (typeof f === "function") {
      try {
        const s2 = f(p);
        if (s2 != null) return String(s2);
      } catch (e2) {
      }
    }
    return (p >= 0 ? "+" : "") + this._fmt(p) + "%";
  }
  /**
   * The readout lines for a ruler: `measure.label` override, else the default
   * per-mode text.
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st @param {string} mode
   * @returns {string[]}
   */
  _label(a2, b, st, mode) {
    const fn = this._cfg().label;
    if (typeof fn === "function") {
      const out = fn({
        from: { x: a2.x, y: a2.y },
        to: { x: b.x, y: b.y },
        dx: st.dx,
        dy: st.dy,
        percentChange: st.pct,
        slope: st.slope,
        mode
      });
      return Array.isArray(out) ? out.map(String) : [String(out)];
    }
    if (mode === "span") {
      const arrow = st.dy === 0 ? "" : st.dy > 0 ? " ↑" : " ↓";
      const pct = isFinite(st.pct) ? "(" + this._fmtPct(st.pct) + ")" : "";
      return [this._fmtY(st.dy) + "  " + pct + arrow, this._fmtX(a2.x) + "  to  " + this._fmtX(b.x)];
    }
    return ["Δx " + this._fmtDx(st.dx), "Δy " + this._fmtY(st.dy), this._fmtPct(st.pct)];
  }
  /**
   * Format an x delta, treating datetime x as a day count.
   * @param {number} dx
   */
  _fmtDx(dx) {
    if (this.w.config.xaxis.type === "datetime") {
      const days = dx / 864e5;
      return Math.round(days * 10) / 10 + "d";
    }
    return this._fmt(dx);
  }
  /**
   * Format a y value (a delta) via the y-axis label formatter when present.
   * @param {number} v
   */
  _fmtY(v) {
    const cf = this._cfg().format && this._cfg().format.y;
    if (typeof cf === "function") {
      try {
        const s2 = cf(v);
        if (s2 != null) return String(s2);
      } catch (e2) {
      }
    }
    const f = this.w.globals.yLabelFormatters && this.w.globals.yLabelFormatters[0];
    if (typeof f === "function") {
      try {
        const s2 = f(v, { seriesIndex: 0, dataPointIndex: -1, w: this.w });
        if (s2 != null && s2 !== "") return String(s2);
      } catch (e2) {
      }
    }
    return this._fmt(v);
  }
  /**
   * Format an x value: a short date for datetime x, else the x-label formatter
   * or a plain number.
   * @param {number} x
   */
  _fmtX(x) {
    const w = this.w;
    const cf = this._cfg().format && this._cfg().format.x;
    if (typeof cf === "function") {
      try {
        const s2 = cf(x);
        if (s2 != null) return String(s2);
      } catch (e2) {
      }
    }
    if (w.config.xaxis.type === "datetime") {
      const d = new Date(x);
      return d.toLocaleDateString(void 0, {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
    const f = w.globals.xLabelFormatter;
    if (typeof f === "function") {
      try {
        const s2 = f(x, { w });
        if (s2 != null && s2 !== "") return String(s2);
      } catch (e2) {
      }
    }
    return this._fmt(x);
  }
  /** The live overlay group, created lazily inside elGraphical. */
  _liveGroup() {
    const w = this.w;
    if (this._live && this._live.node && this._live.node.parentNode) {
      return this._live;
    }
    const g = this.graphics.group({ class: "apexcharts-measure-live" });
    g.node.style.pointerEvents = "none";
    if (w.dom.elGraphical) w.dom.elGraphical.add(g);
    this._live = g;
    return g;
  }
  _clearLive() {
    if (this._live && this._live.node) {
      const n2 = this._live.node;
      if (n2.parentNode) n2.parentNode.removeChild(n2);
    }
    this._live = null;
  }
  _renderLive() {
    if (!this.drag) return;
    const g = this._liveGroup();
    while (g.node.firstChild) g.node.removeChild(g.node.firstChild);
    const a2 = this._resolve(this.drag.a);
    const b = this._resolve(this.drag.b);
    this._drawRuler(g, a2, b, false, this._mode());
  }
  /** Redraw all pinned rulers into a fresh group (called after each render). */
  _renderPins() {
    const w = this.w;
    const old = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-measure-pins");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!this.pins.length || !w.dom.elGraphical) return;
    const g = this.graphics.group({ class: "apexcharts-measure-pins" });
    g.node.style.pointerEvents = "none";
    w.dom.elGraphical.add(g);
    this.pins.forEach((p) => {
      const a2 = __spreadProps(__spreadValues({}, this._dataToGrid(p.xa, p.ya)), { x: p.xa, y: p.ya });
      const b = __spreadProps(__spreadValues({}, this._dataToGrid(p.xb, p.yb)), { x: p.xb, y: p.yb });
      this._drawRuler(g, a2, b, true, p.mode || "span");
    });
  }
  /**
   * Draw one ruler into `g`, dispatching on style.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {boolean} [pinned]
   * @param {string} [mode] 'span' (finance-style band, default) | 'free'
   */
  _drawRuler(g, a2, b, pinned, mode) {
    const st = this._stats(a2, b);
    const rg = this.graphics.group({
      class: "apexcharts-measure-ruler " + this._dirClass(st.dy) + (pinned ? " apexcharts-measure-pinned" : "")
    });
    if ((mode || this._mode()) === "free") this._drawFree(rg, a2, b, st);
    else this._drawSpan(rg, a2, b, st);
    g.add(rg);
  }
  /** Endpoint dots on the series line (skipped when markers:false).
   * @param {any} g @param {{gx:number,gy:number}} p @param {string} color */
  _dot(g, p, color) {
    if (this._cfg().markers === false) return;
    const dot = this.graphics.drawMarker(p.gx, p.gy, {
      pSize: 4,
      shape: "circle",
      pointFillColor: color,
      pointFillOpacity: 1,
      pointStrokeColor: "#fff",
      pointStrokeWidth: 2,
      pointStrokeOpacity: 1
    });
    g.add(dot);
  }
  /** Draw the readout label box + text into `g` at (bx,by).
   * @param {any} g @param {string[]} lines @param {number} bx @param {number} by
   * @param {number} boxW @param {number} boxH @param {string} color */
  _readout(g, lines, bx, by, boxW, boxH, color) {
    const box = this.graphics.drawRect(bx, by, boxW, boxH, 4);
    box.node.setAttribute("class", "apexcharts-measure-label-bg");
    box.attr({ fill: "#ffffff", "fill-opacity": 0.95, stroke: color, "stroke-width": 1 });
    g.add(box);
    const label = this.graphics.drawText({
      x: bx + 9,
      y: by + 15,
      text: lines,
      textAnchor: "start",
      fontSize: "11px",
      foreColor: "#1e293b",
      cssClass: "apexcharts-measure-label"
    });
    g.add(label);
  }
  /**
   * Finance-style ruler: vertical guides + shaded band + endpoints on the
   * series line + a top readout. Guides/band/markers are individually
   * toggleable via config.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st
   */
  _drawSpan(g, a2, b, st) {
    const w = this.w;
    const cfg = this._cfg();
    const gh = w.layout.gridHeight;
    const color = this._dirColor(st.dy);
    const lx = Math.min(a2.gx, b.gx);
    const rx = Math.max(a2.gx, b.gx);
    if (cfg.band !== false) {
      const band = this.graphics.drawRect(lx, 0, Math.max(0, rx - lx), gh, 0);
      band.node.setAttribute("class", "apexcharts-measure-band");
      band.attr({ fill: color, "fill-opacity": 0.09, stroke: "none" });
      g.add(band);
    }
    if (cfg.guides !== false) {
      [a2, b].forEach((p) => {
        const vline = this.graphics.drawLine(p.gx, 0, p.gx, gh, this._colors().guide, 4, 1);
        vline.node.setAttribute("class", "apexcharts-measure-vline");
        g.add(vline);
      });
    }
    [a2, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a2, b, st, "span");
    const longest = lines.reduce((m, s2) => Math.max(m, s2.length), 0);
    const boxW = Math.max(148, longest * 6.4);
    const boxH = 20 + lines.length * 15;
    let bx = (lx + rx) / 2 - boxW / 2;
    bx = Math.max(2, Math.min(bx, w.layout.gridWidth - boxW - 2));
    this._readout(g, lines, bx, 4, boxW, boxH, color);
  }
  /**
   * Free 2D ruler: a diagonal line between two arbitrary points + a readout.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st
   */
  _drawFree(g, a2, b, st) {
    const color = this._dirColor(st.dy);
    const line = this.graphics.drawLine(a2.gx, a2.gy, b.gx, b.gy, color, 0, 2);
    line.node.setAttribute("class", "apexcharts-measure-line");
    g.add(line);
    [a2, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a2, b, st, "free");
    const longest = lines.reduce((m, s2) => Math.max(m, s2.length), 0);
    const boxW = Math.max(72, longest * 6.2);
    const boxH = 16 + lines.length * 15;
    let bx = (a2.gx + b.gx) / 2 + 8;
    let by = (a2.gy + b.gy) / 2 - boxH / 2;
    bx = Math.max(2, Math.min(bx, this.w.layout.gridWidth - boxW - 2));
    by = Math.max(2, Math.min(by, this.w.layout.gridHeight - boxH - 2));
    this._readout(g, lines, bx, by, boxW, boxH, color);
  }
  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   */
  _fireMeasured(a2, b) {
    const st = this._stats(a2, b);
    const payload = {
      from: { x: a2.x, y: a2.y },
      to: { x: b.x, y: b.y },
      dx: st.dx,
      dy: st.dy,
      percentChange: st.pct,
      slope: st.slope
    };
    const fn = this.w.config.chart.events.measured;
    if (typeof fn === "function") fn(this.ctx, payload);
    this.ctx.events.fireEvent("measured", [this.ctx, payload]);
  }
  /** Re-project the measure pins after each render. */
  _afterRender() {
    if (!this._enabled()) return;
    if (this.w.interact.measureEnabled && !this.persistent) {
      this.persistent = true;
    }
    if (this.pins.length) this._renderPins();
    if (this.persistent && !this.drag) {
      this._disarm();
      this._arm();
    }
  }
  teardown() {
    this._cancelDrag();
    this._endSeed(false);
    this._disarm();
    const doc = this._doc();
    if (doc && this._keysBound) {
      doc.removeEventListener("keydown", this._onKeyDown);
      doc.removeEventListener("keyup", this._onKeyUp);
    }
    this._keysBound = false;
    this.pins = [];
  }
}
ApexCharts__default.registerFeatures({ measure: Measure });
class ContextMenu {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.menu = null;
    this._items = [];
    this._focusIndex = -1;
    this._trigger = null;
    this._onContext = this._onContext.bind(this);
    this._onDocDown = this._onDocDown.bind(this);
    this._onKey = this._onKey.bind(this);
    this._afterRender = this._afterRender.bind(this);
    ctx.addEventListener("mounted", this._afterRender);
    ctx.addEventListener("updated", this._afterRender);
  }
  _cfg() {
    return this.w.config.chart.contextMenu || {};
  }
  _enabled() {
    return this._cfg().enabled === true;
  }
  _doc() {
    return this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
  }
  /** (Re)attach the contextmenu trigger to the freshly (re)built SVG. */
  _afterRender() {
    this._detachTrigger();
    this.close();
    if (!this._enabled() || !Environment.isBrowser()) return;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (!svg) return;
    svg.addEventListener("contextmenu", this._onContext);
    this._trigger = svg;
  }
  _detachTrigger() {
    if (this._trigger) {
      this._trigger.removeEventListener("contextmenu", this._onContext);
      this._trigger = null;
    }
  }
  /** @param {any} e */
  _onContext(e2) {
    if (!this._enabled()) return;
    e2.preventDefault();
    this.open(e2.clientX, e2.clientY);
  }
  /**
   * Client pixel -> data {x,y} via the grid client-rect fraction (scale
   * independent). Null when the grid is not measurable.
   * @param {number} cx @param {number} cy
   * @returns {{x:number,y:number}|null}
   */
  _clientToData(cx, cy) {
    const w = this.w;
    const grid = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!grid) return null;
    const r2 = grid.getBoundingClientRect();
    if (!r2.width || !r2.height) return null;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = clamp((cx - r2.left) / r2.width);
    const fy = clamp((cy - r2.top) / r2.height);
    const x = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const s2 = w.globals.yAxisScale && w.globals.yAxisScale[0];
    const ymin = s2 && isFinite(s2.niceMin) ? s2.niceMin : w.globals.minY;
    const ymax = s2 && isFinite(s2.niceMax) ? s2.niceMax : w.globals.maxY;
    const y = ymax - fy * (ymax - ymin);
    return { x, y };
  }
  /**
   * Resolve the configured items into runnable entries, dropping built-ins
   * whose dependency is absent (e.g. measure not enabled).
   * @param {any} context
   * @returns {Array<{id:string,label:string,run:Function}>}
   */
  _resolveItems(context) {
    const cfg = this._cfg();
    const raw = Array.isArray(cfg.items) && cfg.items.length ? cfg.items : ["annotate", "xline", "yline", "measure"];
    const labels = cfg.labels || {};
    const out = [];
    raw.forEach((it) => {
      if (typeof it === "string") {
        if (it === "annotate") {
          out.push({
            id: "annotate",
            label: labels.annotate || "Add note here",
            run: () => this._annotate(context)
          });
        } else if (it === "xline") {
          out.push({
            id: "xline",
            label: labels.xline || "Annotate here",
            run: () => this._line(context, "x")
          });
        } else if (it === "yline") {
          out.push({
            id: "yline",
            label: labels.yline || "Mark this level",
            run: () => this._line(context, "y")
          });
        } else if (it === "measure") {
          const m = this.ctx.measure;
          const on = m && this.w.config.chart.measure && this.w.config.chart.measure.enabled;
          if (on) {
            out.push({
              id: "measure",
              label: labels.measure || "Measure from here",
              run: () => m.seedFromClient(context.clientX, context.clientY)
            });
          }
        }
      } else if (it && typeof it === "object" && typeof it.onClick === "function") {
        out.push({
          id: it.id || "custom",
          label: it.label || "Action",
          run: () => it.onClick(this.ctx, context)
        });
      }
    });
    return out;
  }
  /** @param {any} context */
  _annotate(context) {
    if (context.x == null || context.y == null) return;
    const cfg = this._cfg();
    const ink = this.ctx.ink;
    if (ink && typeof ink.createAt === "function") {
      ink.createAt(context.x, context.y, { text: cfg.noteText || "Note" });
      return;
    }
    this.ctx.addPointAnnotation(
      {
        x: context.x,
        y: context.y,
        marker: { size: 5 },
        label: {
          text: cfg.noteText || "Note",
          style: { background: "#fff", color: "#334155" }
        }
      },
      true
    );
  }
  /**
   * The 'xline' / 'yline' items: drop a dashed line annotation at the clicked
   * data point ('x' = vertical line at the clicked x, 'y' = horizontal line
   * at the clicked y). Lines only: no x2/y2 is ever set, so this never
   * creates a range rectangle. Both items share chart.contextMenu.line
   * ({ text, strokeDashArray, color }) for styling.
   * @param {any} context @param {'x'|'y'} axis
   */
  _line(context, axis) {
    const lc = this._cfg().line || {};
    const val = axis === "x" ? context.x : context.y;
    if (val == null) return;
    const ink = this.ctx.ink;
    if (ink && typeof ink.createLineAt === "function") {
      ink.createLineAt(axis, val, {
        text: lc.text,
        strokeDashArray: lc.strokeDashArray,
        color: lc.color
      });
      return;
    }
    const anno = {
      strokeDashArray: lc.strokeDashArray != null ? lc.strokeDashArray : 4
    };
    if (lc.text) anno.label = { text: lc.text };
    if (lc.color) {
      anno.borderColor = lc.color;
      anno.label = Utils.extend(anno.label || {}, { borderColor: lc.color });
    }
    if (axis === "x") {
      this.ctx.addXaxisAnnotation(Utils.extend(anno, { x: val }), true);
    } else {
      this.ctx.addYaxisAnnotation(Utils.extend(anno, { y: val }), true);
    }
  }
  /**
   * Open the menu at a client-space point.
   * @param {number} clientX @param {number} clientY
   */
  open(clientX, clientY) {
    this.close();
    const w = this.w;
    const elWrap = w.dom.elWrap;
    const doc = this._doc();
    if (!elWrap || !doc) return;
    const data = this._clientToData(clientX, clientY);
    const g = w.globals;
    const context = {
      x: data ? data.x : null,
      y: data ? data.y : null,
      seriesIndex: g.capturedSeriesIndex >= 0 ? g.capturedSeriesIndex : null,
      dataPointIndex: g.capturedDataPointIndex >= 0 ? g.capturedDataPointIndex : null,
      clientX,
      clientY
    };
    const items = this._resolveItems(context);
    if (!items.length) return;
    this._items = items;
    const menu = doc.createElement("div");
    menu.className = "apexcharts-context-menu";
    menu.setAttribute("role", "menu");
    menu.style.position = "absolute";
    menu.style.visibility = "hidden";
    items.forEach((it, i2) => {
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "apexcharts-context-menu-item";
      btn.setAttribute("role", "menuitem");
      btn.tabIndex = -1;
      btn.textContent = it.label;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._activate(i2);
      });
      btn.addEventListener("mouseenter", () => this._focus(i2));
      menu.appendChild(btn);
    });
    elWrap.appendChild(menu);
    this.menu = menu;
    const wrapRect = elWrap.getBoundingClientRect();
    let left = clientX - wrapRect.left;
    let top = clientY - wrapRect.top;
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const maxLeft = Math.max(0, elWrap.clientWidth - mw);
    const maxTop = Math.max(0, elWrap.clientHeight - mh);
    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = maxTop;
    menu.style.left = Math.max(0, left) + "px";
    menu.style.top = Math.max(0, top) + "px";
    menu.style.visibility = "visible";
    doc.addEventListener("mousedown", this._onDocDown, true);
    doc.addEventListener("keydown", this._onKey, true);
    this._focus(0);
  }
  /** @param {number} i */
  _focus(i2) {
    if (!this.menu) return;
    const btns = this.menu.querySelectorAll(".apexcharts-context-menu-item");
    if (this._focusIndex >= 0 && btns[this._focusIndex]) {
      btns[this._focusIndex].classList.remove("apexcharts-context-menu-item--active");
    }
    this._focusIndex = i2;
    if (btns[i2]) {
      btns[i2].classList.add("apexcharts-context-menu-item--active");
      if (typeof btns[i2].focus === "function") btns[i2].focus();
    }
  }
  /** @param {number} i */
  _activate(i2) {
    const it = this._items[i2];
    this.close();
    if (it) it.run();
  }
  /** @param {any} e */
  _onDocDown(e2) {
    if (this.menu && this.menu.contains(e2.target)) return;
    this.close();
  }
  /** @param {any} e */
  _onKey(e2) {
    if (!this.menu || !this._items.length) return;
    if (e2.key === "Escape") {
      e2.preventDefault();
      this.close();
    } else if (e2.key === "ArrowDown") {
      e2.preventDefault();
      this._focus((this._focusIndex + 1) % this._items.length);
    } else if (e2.key === "ArrowUp") {
      e2.preventDefault();
      this._focus((this._focusIndex - 1 + this._items.length) % this._items.length);
    } else if (e2.key === "Enter" || e2.key === " ") {
      e2.preventDefault();
      this._activate(this._focusIndex < 0 ? 0 : this._focusIndex);
    }
  }
  close() {
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousedown", this._onDocDown, true);
      doc.removeEventListener("keydown", this._onKey, true);
    }
    if (this.menu && this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }
    this.menu = null;
    this._items = [];
    this._focusIndex = -1;
  }
  teardown() {
    this.close();
    this._detachTrigger();
  }
}
ApexCharts__default.registerFeatures({ contextMenu: ContextMenu });
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
  const n2 = sorted.length;
  if (n2 === 0) return NaN;
  if (n2 === 1) return sorted[0];
  const pos = (n2 - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
function stdDev(values) {
  const n2 = values.length;
  if (n2 < 2) return 0;
  let sum = 0;
  for (let i2 = 0; i2 < n2; i2++) sum += values[i2];
  const mean = sum / n2;
  let acc = 0;
  for (let i2 = 0; i2 < n2; i2++) {
    const d = values[i2] - mean;
    acc += d * d;
  }
  return Math.sqrt(acc / n2);
}
function widthForRule(sorted, span, rule) {
  const n2 = sorted.length;
  const byCount = (count) => span / Math.max(1, Math.ceil(count));
  switch (rule) {
    case "sqrt":
      return { width: byCount(Math.sqrt(n2)), rule: "sqrt" };
    case "rice":
      return { width: byCount(2 * Math.cbrt(n2)), rule: "rice" };
    case "scott": {
      const sd = stdDev(sorted);
      if (sd > 0) return { width: 3.49 * sd * Math.pow(n2, -1 / 3), rule: "scott" };
      return { width: byCount(Math.log2(n2) + 1), rule: "sturges" };
    }
    case "fd": {
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
      if (iqr > 0) return { width: 2 * iqr * Math.pow(n2, -1 / 3), rule: "fd" };
      return { width: byCount(Math.log2(n2) + 1), rule: "sturges" };
    }
    case "auto": {
      const sturges = byCount(Math.log2(n2) + 1);
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
      if (iqr <= 0) return { width: sturges, rule: "sturges" };
      const fd = 2 * iqr * Math.pow(n2, -1 / 3);
      return fd < sturges ? { width: fd, rule: "fd" } : { width: sturges, rule: "sturges" };
    }
    case "sturges":
    default:
      return { width: byCount(Math.log2(n2) + 1), rule: "sturges" };
  }
}
function computeBinning(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a2, b) => a2 - b);
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
function binIndexOf(v, edges) {
  const last = edges.length - 1;
  if (!(v >= edges[0]) || v > edges[last]) return -1;
  if (v === edges[last]) return last - 1;
  const width = (edges[last] - edges[0]) / last;
  if (width > 0) {
    let k = Math.floor((v - edges[0]) / width);
    if (k < 0) k = 0;
    if (k > last - 1) k = last - 1;
    if (v < edges[k]) k--;
    else if (v >= edges[k + 1]) k++;
    if (k < 0 || k > last - 1) return -1;
    return k;
  }
  let lo = 0;
  let hi = last - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    if (v < edges[mid]) hi = mid - 1;
    else if (v >= edges[mid + 1]) lo = mid + 1;
    else return mid;
  }
  return -1;
}
function binCounts(values, edges) {
  const counts = new Array(Math.max(0, edges.length - 1)).fill(0);
  for (let i2 = 0; i2 < values.length; i2++) {
    const k = binIndexOf(values[i2], edges);
    if (k >= 0) counts[k]++;
  }
  return counts;
}
function rowsByBin(values, edges) {
  const n2 = Math.max(0, edges.length - 1);
  const buckets = new Array(n2);
  for (let k = 0; k < n2; k++) buckets[k] = [];
  for (let i2 = 0; i2 < values.length; i2++) {
    const k = binIndexOf(values[i2], edges);
    if (k >= 0) buckets[k].push(values[i2]);
  }
  return buckets;
}
function fiveNumberSummary(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a2, b) => a2 - b);
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
    let i2 = 0;
    while (i2 < sorted.length && sorted[i2] < loFence) i2++;
    let j = sorted.length - 1;
    while (j >= 0 && sorted[j] > hiFence) j--;
    if (i2 <= j) {
      lo = sorted[i2];
      hi = sorted[j];
      outliers = sorted.slice(0, i2).concat(sorted.slice(j + 1));
    }
  }
  return { summary: [lo, q1, median, q3, hi], outliers, iqr };
}
function kernelDensity(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a2, b) => a2 - b);
  const n2 = sorted.length;
  let h2 = opts.bandwidth;
  if (!(typeof h2 === "number" && h2 > 0)) {
    const sd = stdDev(sorted);
    const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
    const spread = iqr > 0 ? Math.min(sd, iqr / 1.349) : sd;
    h2 = 0.9 * spread * Math.pow(n2, -1 / 5);
  }
  if (!isFinite(h2) || h2 <= 0) {
    const v = sorted[0];
    const eps = Math.abs(v) > 0 ? Math.abs(v) * 1e-3 : 1e-3;
    return {
      density: [
        [v - eps, 0],
        [v, 1],
        [v + eps, 0]
      ],
      bandwidth: eps
    };
  }
  const steps = Math.max(8, Math.floor(opts.resolution || 64));
  const lo = sorted[0] - 2 * h2;
  const hi = sorted[n2 - 1] + 2 * h2;
  const step = (hi - lo) / (steps - 1);
  const norm = 1 / (n2 * h2 * Math.sqrt(2 * Math.PI));
  const density = [];
  for (let g = 0; g < steps; g++) {
    const x = lo + g * step;
    let sum = 0;
    for (let i2 = 0; i2 < n2; i2++) {
      const z = (x - sorted[i2]) / h2;
      sum += Math.exp(-0.5 * z * z);
    }
    density.push([x, sum * norm]);
  }
  return { density, bandwidth: h2 };
}
function normalizeCounts(counts, opts = {}) {
  let out = counts.slice();
  if (opts.cumulative) {
    let acc = 0;
    out = out.map((c2) => acc += c2);
  }
  const total = counts.reduce((a2, b) => a2 + b, 0);
  if (total <= 0) return out;
  if (opts.normalize === "relative") {
    return out.map((c2) => c2 / total * 100);
  }
  if (opts.normalize === "density") {
    const w = opts.binWidth;
    if (typeof w === "number" && w > 0) return out.map((c2) => c2 / (total * w));
  }
  return out;
}
function histogramValues(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  for (let i2 = 0; i2 < data.length; i2++) {
    const d = data[i2];
    let raw = d;
    if (Array.isArray(d)) raw = d.length === 1 ? d[0] : d[1];
    else if (d && typeof d === "object") raw = d.y !== void 0 ? d.y : d.x;
    const v = Utils.parseNumber(raw);
    if (v !== null && isFinite(v)) out.push(v);
  }
  return out;
}
function histogramTransform(ser, w) {
  var _a;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.histogramRawSeries) {
    gl.histogramRawSeries = ser.map((s2) => __spreadProps(__spreadValues({}, s2), {
      data: Array.isArray(s2 == null ? void 0 : s2.data) ? s2.data.slice() : s2 == null ? void 0 : s2.data
    }));
  }
  const raw = gl.histogramRawSeries;
  const hcfg = ((_a = cnf.plotOptions) == null ? void 0 : _a.histogram) || {};
  const perSeries = raw.map((s2) => histogramValues(s2 == null ? void 0 : s2.data));
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
    w.histogramData = {
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
  w.histogramData = {
    edges,
    binWidth,
    counts,
    rule: binning.rule,
    capped: binning.capped
  };
  const collapsed = gl.collapsedSeriesIndices || [];
  return raw.map((s2, i2) => {
    if (collapsed.indexOf(i2) !== -1) return __spreadProps(__spreadValues({}, s2), { data: [] });
    const ys = normalizeCounts(counts[i2], {
      normalize: hcfg.normalize,
      cumulative: hcfg.cumulative,
      binWidth
    });
    const data = [];
    for (let k = 0; k < ys.length; k++) {
      data.push({ x: (edges[k] + edges[k + 1]) / 2, y: ys[k] });
    }
    return __spreadProps(__spreadValues({}, s2), { data });
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
  for (let i2 = 0; i2 < raw.length; i2++) {
    const v = Utils.parseNumber(raw[i2]);
    if (v !== null && isFinite(v)) out.push(v);
  }
  return out.length ? out : null;
}
function boxPlotTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const whiskers = ((_b = (_a = w.config.plotOptions) == null ? void 0 : _a.boxPlot) == null ? void 0 : _b.whiskers) || "minmax";
  return ser.map((s2) => {
    if (!Array.isArray(s2 == null ? void 0 : s2.data)) return s2;
    let touched = false;
    const data = s2.data.map((d) => {
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
    return touched ? __spreadProps(__spreadValues({}, s2), { data }) : s2;
  });
}
function violinTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const kde = ((_b = (_a = w.config.plotOptions) == null ? void 0 : _a.violin) == null ? void 0 : _b.kde) || {};
  return ser.map((s2) => {
    if (!Array.isArray(s2 == null ? void 0 : s2.data)) return s2;
    let touched = false;
    const data = s2.data.map((d) => {
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
    return touched ? __spreadProps(__spreadValues({}, s2), { data }) : s2;
  });
}
const DEFAULT_MAX_ROWS = 3e3;
function thinClusters(clusters, maxRows) {
  let total = 0;
  let widest = 0;
  for (const c2 of clusters) {
    total += c2.length;
    if (c2.length > widest) widest = c2.length;
  }
  if (total <= maxRows) return { clusters, stride: 1, total, kept: total };
  const keptAt = (s2) => {
    let n2 = 0;
    for (const c2 of clusters) n2 += Math.ceil(c2.length / s2);
    return n2;
  };
  let stride = Math.max(2, Math.ceil(total / maxRows));
  while (stride < widest && keptAt(stride) > maxRows) stride++;
  let kept = 0;
  const out = clusters.map((rows) => {
    const keepList = [];
    for (let i2 = 0; i2 < rows.length; i2 += stride) keepList.push(rows[i2]);
    kept += keepList.length;
    return keepList;
  });
  return { clusters: out, stride, total, kept };
}
function toUnitSeries(w, clusters, opts) {
  const maxRows = opts && opts.maxRows != null ? opts.maxRows : DEFAULT_MAX_ROWS;
  const thinned = thinClusters(
    clusters.map((c2) => c2.rows),
    maxRows
  );
  if (thinned.stride > 1) {
    console.warn(
      `ApexCharts: rowSeries() thinned ${thinned.total} rows to ${thinned.kept} (every ${thinned.stride}${thinned.stride === 2 ? "nd" : thinned.stride === 3 ? "rd" : "th"} row) to stay under maxRows=${maxRows}. Raise maxRows to draw more.`
    );
  }
  const colors = w.globals && w.globals.colors || [];
  return clusters.map((c2, i2) => {
    const fillColor = colors[c2.realIndex] || colors[0];
    return {
      name: c2.name,
      data: thinned.clusters[i2].map((v, q) => __spreadValues({
        id: `${c2.realIndex}:${i2}:${q}`,
        x: c2.name,
        y: v
      }, fillColor ? { fillColor } : {}))
    };
  });
}
function histogramRows(w, opts) {
  const gl = w.globals;
  const hd = w.histogramData;
  const raw = gl && gl.histogramRawSeries;
  if (!hd || !Array.isArray(hd.edges) || hd.edges.length < 2) return null;
  if (!Array.isArray(raw) || !raw.length) return null;
  const collapsed = gl && gl.collapsedSeriesIndices || [];
  const edges = hd.edges;
  const clusters = [];
  raw.forEach((s2, i2) => {
    var _a;
    if (collapsed.indexOf(i2) !== -1) return;
    const buckets = rowsByBin(histogramValues(s2 && s2.data), edges);
    const seriesName = w.seriesData && ((_a = w.seriesData.seriesNames) == null ? void 0 : _a[i2]) || (s2 == null ? void 0 : s2.name);
    buckets.forEach((rows, k) => {
      const range = `${formatEdge(edges[k])}-${formatEdge(edges[k + 1])}`;
      clusters.push({
        // Only qualify by series when there is more than one to tell apart.
        name: raw.length > 1 && seriesName ? `${seriesName} ${range}` : range,
        realIndex: i2,
        rows
      });
    });
  });
  return clusters.length ? toUnitSeries(w, clusters, opts) : null;
}
function formatEdge(v) {
  if (!isFinite(v)) return String(v);
  const r2 = Math.round(v);
  return Math.abs(v - r2) < 1e-6 ? String(r2) : String(Number(v.toFixed(2)));
}
function pointsRowSource(pick) {
  return (w, opts) => {
    var _a;
    const perSeries = pick(w);
    if (!Array.isArray(perSeries) || !perSeries.length) return null;
    const collapsed = w.globals && w.globals.collapsedSeriesIndices || [];
    const labels = w.globals && (((_a = w.globals.categoryLabels) == null ? void 0 : _a.length) ? w.globals.categoryLabels : w.globals.labels) || [];
    const clusters = [];
    perSeries.forEach((byCat, i2) => {
      var _a2;
      if (collapsed.indexOf(i2) !== -1) return;
      if (!Array.isArray(byCat)) return;
      const seriesName = w.seriesData && ((_a2 = w.seriesData.seriesNames) == null ? void 0 : _a2[i2]);
      byCat.forEach((pts, j) => {
        const label = labels[j] != null ? String(labels[j]) : `#${j + 1}`;
        clusters.push({
          name: perSeries.length > 1 && seriesName ? `${seriesName} ${label}` : label,
          realIndex: i2,
          rows: Array.isArray(pts) ? pts.slice() : []
        });
      });
    });
    return clusters.length ? toUnitSeries(w, clusters, opts) : null;
  };
}
const boxPlotRows = pointsRowSource((w) => {
  var _a;
  return (_a = w.candleData) == null ? void 0 : _a.seriesBoxPoints;
});
const violinRows = pointsRowSource((w) => {
  var _a;
  return (_a = w.violinData) == null ? void 0 : _a.seriesViolinPoints;
});
registerSeriesTransform("histogram", histogramTransform);
registerSeriesTransform("boxPlot", boxPlotTransform);
registerSeriesTransform("violin", violinTransform);
registerRowSource("histogram", histogramRows);
registerRowSource("boxPlot", boxPlotRows);
registerRowSource("violin", violinRows);
