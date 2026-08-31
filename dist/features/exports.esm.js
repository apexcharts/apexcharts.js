/*!
 * ApexCharts v7.1.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const AxesUtils = _core.__apex_axes_AxesUtils;
const Data = _core.__apex_Data;
const Series = _core.__apex_Series;
const Utils = _core.__apex_Utils;
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const SVGNS = _core.__apex_math_SVGNS;
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
    for (let i = 0; i < origCanvases.length && i < clonedFOs.length; i++) {
      let dataURL;
      try {
        dataURL = /** @type {HTMLCanvasElement} */
        origCanvases[i].toDataURL();
      } catch (e) {
        continue;
      }
      const fo = clonedFOs[i];
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
    const gSeries = w.seriesData.series.map((s, i) => {
      return w.globals.collapsedSeriesIndices.indexOf(i) === -1 ? s : [];
    });
    const csvSafe = (val) => {
      if (val == null || Utils.isNumber(val)) return val;
      const s = String(val);
      return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
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
      if (!w.globals.axisCharts) {
        cat = w.config.labels[i];
      } else {
        if (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) {
          if (w.globals.isBarHorizontal) {
            const lbFormatter = w.formatters.yLabelFormatters[0];
            const sr = new Series(this.ctx.w);
            const activeSeries = sr.getActiveConfigSeriesIndex();
            cat = lbFormatter(w.labelData.labels[i], {
              seriesIndex: activeSeries,
              dataPointIndex: i,
              w
            });
          } else {
            cat = axesUtils.getLabel(
              w.labelData.labels,
              w.labelData.timescaleLabels,
              0,
              i
            ).text;
          }
        }
        if (w.config.xaxis.type === "datetime") {
          if (w.config.xaxis.categories.length) {
            cat = w.config.xaxis.categories[i];
          } else if (w.config.labels.length) {
            cat = w.config.labels[i];
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
            for (let ci = 0; ci < w.seriesData.series.length; ci++) {
              const value = dataFormat.isFormatXY() ? (_a = series[ci].data[i]) == null ? void 0 : _a.y : gSeries[ci][i];
              columns.push(getFormattedValue(value));
            }
          }
          if (w.config.chart.type === "candlestick" || s.type && s.type === "candlestick") {
            columns.pop();
            columns.push(w.candleData.seriesCandleO[sI][i]);
            columns.push(w.candleData.seriesCandleH[sI][i]);
            columns.push(w.candleData.seriesCandleL[sI][i]);
            columns.push(w.candleData.seriesCandleC[sI][i]);
          }
          if (w.config.chart.type === "boxPlot" || s.type && s.type === "boxPlot") {
            columns.pop();
            columns.push(w.candleData.seriesCandleO[sI][i]);
            columns.push(w.candleData.seriesCandleH[sI][i]);
            columns.push(w.candleData.seriesCandleM[sI][i]);
            columns.push(w.candleData.seriesCandleL[sI][i]);
            columns.push(w.candleData.seriesCandleC[sI][i]);
          }
          if (w.config.chart.type === "rangeBar") {
            columns.pop();
            columns.push(w.rangeData.seriesRangeStart[sI][i]);
            columns.push(w.rangeData.seriesRangeEnd[sI][i]);
          }
          if (w.config.chart.type === "violin" || s.type && s.type === "violin") {
            columns.pop();
            columns.push((_b = w.violinData.seriesViolinMin[sI]) == null ? void 0 : _b[i]);
            columns.push((_c = w.violinData.seriesViolinMax[sI]) == null ? void 0 : _c[i]);
            columns.push((_f = (_e = (_d = w.violinData.seriesViolinPoints[sI]) == null ? void 0 : _d[i]) == null ? void 0 : _e.length) != null ? _f : 0);
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
      series.map((s, sI) => {
        const sname = (s.name ? s.name : `series-${sI}`) + "";
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
      series.map((s, sI) => {
        if (w.globals.axisCharts) {
          handleAxisRowsColumns(s, sI);
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
_core__default.registerFeatures({ exports: Exports });
export {
  default2 as default
};
