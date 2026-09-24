var __defProp = Object.defineProperty;
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
/*!
 * ApexCharts v7.6.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const Environment = _core.__apex_Environment_Environment;
function drilldownById(w, id) {
  const dd = w.config.drilldown;
  const list = dd && Array.isArray(dd.series) ? dd.series : [];
  return list.find((s) => s && s.id === id);
}
function toNode(w, d, i, paletteFromParent, parentKey, seenIds = null, opts = {}) {
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
      (c, j) => toNode(w, c, j, null, node._key, seenIds, opts)
    );
  } else if (isObj && d.drilldown != null && opts.expandDrilldown !== false) {
    const visited = seenIds || /* @__PURE__ */ new Set();
    if (!visited.has(d.drilldown)) {
      const dd = drilldownById(w, d.drilldown);
      if (dd && Array.isArray(dd.data) && dd.data.length) {
        const nextSeen = new Set(visited);
        nextSeen.add(d.drilldown);
        const palette = Array.isArray(dd.colors) ? dd.colors : null;
        node.children = dd.data.map(
          (c, j) => toNode(w, c, j, palette, node._key, nextSeen, opts)
        );
      }
    }
  }
  return node;
}
function buildHierarchy(w, opts = {}) {
  const cfgSeries = (
    /** @type {any} */
    w.config.series
  );
  const first = cfgSeries && cfgSeries[0];
  const data = first && Array.isArray(first.data) ? first.data : cfgSeries;
  if (!Array.isArray(data)) return [];
  return data.map(
    (d, i) => toNode(w, d, i, null, "", null, opts)
  );
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
const XHTML = "http://www.w3.org/1999/xhtml";
const BREADCRUMB_HEIGHT = 18;
function breadcrumbConfig(w, localCfg) {
  const shared = w.config.drilldown && w.config.drilldown.breadcrumb || {};
  return __spreadValues(__spreadValues({
    show: true,
    position: "top-left",
    separator: " / ",
    rootLabel: "All",
    offsetX: 0,
    offsetY: 0,
    formatter: void 0
  }, shared), {});
}
function breadcrumbCeiling(w, nav) {
  const gridTop = w.layout.translateY || 0;
  const elWrap = w.dom.elWrap;
  if (!elWrap) return gridTop;
  const labels = w.dom.baseEl.querySelectorAll(".apexcharts-yaxis-label");
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
function clearBreadcrumb(w) {
  const elWrap = w.dom.elWrap;
  if (!elWrap) return;
  const existing = elWrap.querySelector(".apexcharts-breadcrumb");
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
}
function renderBreadcrumb(w, opts) {
  if (!Environment.isBrowser()) return null;
  const elWrap = w.dom.elWrap;
  if (!elWrap) return null;
  clearBreadcrumb(w);
  const cfg = opts.config || breadcrumbConfig(w);
  if (cfg.show === false) return null;
  const crumbs = opts.crumbs || [];
  if (crumbs.length < 2) return null;
  const nav = BrowserAPIs.createElementNS(XHTML, "nav");
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
      const sep = BrowserAPIs.createElementNS(XHTML, "span");
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
      const cur = BrowserAPIs.createElementNS(XHTML, "span");
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
      BrowserAPIs.createElementNS(XHTML, "button")
    );
    btn.setAttribute("type", "button");
    btn.setAttribute("class", "apexcharts-breadcrumb-item");
    if (i === 0) {
      const arrow = BrowserAPIs.createElementNS(XHTML, "span");
      arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "←";
      btn.appendChild(arrow);
    }
    const text = BrowserAPIs.createElementNS(XHTML, "span");
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
function placeSubtree(node, vDepth, t0, t1, parent, state) {
  node._show = true;
  node._vDepth = vDepth;
  node._t0 = t0;
  node._t1 = t1;
  node._parent = parent;
  node._leaf = !(node.children && node.children.length);
  node._clipped = !node._leaf && state.cap != null && vDepth >= state.cap;
  if (vDepth > state.maxDepth) state.maxDepth = vDepth;
  if (node._leaf || node._clipped) return;
  const total = node.children.reduce(
    (s, c) => s + Math.max(0, c.value),
    0
  );
  const denom = total || 1;
  let t = t0;
  for (let i = 0; i < node.children.length; i++) {
    const c = node.children[i];
    const span = (t1 - t0) * Math.max(0, c.value) / denom;
    placeSubtree(c, vDepth + 1, t, t + span, node, state);
    t += span;
  }
}
function placeTree({ roots, nodesAll, focus, t0, t1, cap }) {
  for (let i = 0; i < nodesAll.length; i++) nodesAll[i]._show = false;
  const state = { maxDepth: 0, cap };
  if (focus) {
    placeSubtree(focus, 0, t0, t1, focus._parent, state);
    return state.maxDepth;
  }
  const total = roots.reduce(
    (s, r) => s + Math.max(0, r.value),
    0
  );
  const denom = total || 1;
  let t = t0;
  for (let i = 0; i < roots.length; i++) {
    const span = (t1 - t0) * Math.max(0, roots[i].value) / denom;
    placeSubtree(roots[i], 0, t, t + span, null, state);
    t += span;
  }
  return state.maxDepth;
}
function sortTree(roots, sort) {
  if (sort !== "value" && sort !== "name") return;
  const cmp = sort === "value" ? (a, b) => (b.value || 0) - (a.value || 0) : (a, b) => String(a.name).localeCompare(String(b.name));
  const walk = (list) => {
    list.sort(cmp);
    for (let i = 0; i < list.length; i++) {
      if (list[i].children && list[i].children.length) walk(list[i].children);
    }
  };
  walk(roots);
}
function bandScale({ maxDepth, near, far, gap = 0 }) {
  const count = maxDepth + 1;
  const band = (far - near) / count;
  const g = count > 1 ? gap : 0;
  return {
    near: (vDepth) => near + vDepth * band + (vDepth > 0 ? g / 2 : 0),
    far: (vDepth) => near + (vDepth + 1) * band - g / 2
  };
}
function farEdge(node, scale, maxDepth, leafMode, edge) {
  return node._leaf && leafMode === "extend" && node._vDepth < maxDepth ? edge : scale.far(node._vDepth);
}
function validateStrict(roots, { type, remedy }) {
  let warned = false;
  const walk = (node) => {
    if (node.children && node.children.length) {
      const sum = node.children.reduce(
        (s, c) => s + Math.max(0, c.value || 0),
        0
      );
      if (!warned && node.value != null && Math.abs(sum - node.value) > 0.5) {
        console.warn(
          `ApexCharts ${type}: partition 'strict' but "${node.name}" (${node.value}) != sum of its children (${sum}). ${remedy}`
        );
        warned = true;
      }
      node.children.forEach(walk);
    }
  };
  roots.forEach(walk);
}
function focusChain(focus) {
  const chain = [];
  let n = focus;
  while (n) {
    chain.unshift(n);
    n = n._parent;
  }
  return chain;
}
function resolveFocus(node, current, roots) {
  let next = node === current ? node._parent || null : node;
  if (next && !(next.children && next.children.length)) {
    next = next._parent || null;
  }
  if (roots && roots.length === 1 && next === roots[0]) next = null;
  if (next === current) return { changed: false, focus: current };
  return { changed: true, focus: next };
}
function parseSize(size, max, fallbackRatio = 0) {
  if (typeof size === "number") return size;
  const s = String(size).trim();
  if (s.endsWith("%")) return parseFloat(s) / 100 * max;
  const n = parseFloat(s);
  return isNaN(n) ? fallbackRatio * max : n;
}
function lighten(color, amount) {
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
function colorPass(node, color, tint, out) {
  node._color = node.color || color;
  out.push(node);
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const c = node.children[i];
      colorPass(c, c.color || lighten(node._color, tint), tint, out);
    }
  }
}
class NodeTooltip {
  /**
   * @param {any} w
   */
  constructor(w) {
    this.w = w;
    this.total = 1;
    this._el = null;
  }
  /** @returns {any} */
  _tip() {
    if (!this._el) {
      this._el = this.w.dom.baseEl.querySelector(".apexcharts-tooltip");
    }
    return this._el;
  }
  /**
   * @param {any} el  the DOM node for one mark
   * @param {any} node  the tree node it stands for
   */
  attach(el, node) {
    if (!this.w.config.tooltip.enabled || !Environment.isBrowser()) return;
    el.addEventListener(
      "mouseenter",
      (e) => this.show(e, node)
    );
    el.addEventListener(
      "mousemove",
      (e) => this.position(e)
    );
    el.addEventListener("mouseleave", () => this.hide());
  }
  /**
   * @param {MouseEvent} e
   * @param {any} node
   */
  show(e, node) {
    const t = this._tip();
    if (!t) return;
    const w = this.w;
    const pctTotal = (node.value / this.total * 100).toFixed(1);
    const parentVal = node._parent ? node._parent.value : this.total;
    const pctParent = parentVal > 0 ? (node.value / parentVal * 100).toFixed(1) : pctTotal;
    const groupBg = w.config.tooltip.fillSeriesColor ? `background-color:${node._color};` : "";
    t.innerHTML = `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}"><span class="apexcharts-tooltip-marker" style="background-color:${node._color}"></span><div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${node.name}: </span><span class="apexcharts-tooltip-text-y-value">${node.value} (${pctParent}% of parent, ${pctTotal}% of total)</span></div></div></div>`;
    t.classList.add("apexcharts-active");
    t.style.opacity = "1";
    this.position(e);
  }
  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  position(e) {
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
  hide() {
    const t = this._tip();
    if (!t) return;
    t.classList.remove("apexcharts-active");
    t.style.opacity = "0";
  }
}
const SVGNS = "http://www.w3.org/2000/svg";
const MIN_LABEL_CHARS = 3;
const lerp = (a, b, t) => a + (b - a) * t;
class IcicleChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    const cnf = w.config;
    this.cfg = cnf.plotOptions.icicle;
    this.strokeWidth = cnf.stroke.show ? cnf.stroke.width : 0;
    this.strokeColor = Array.isArray(cnf.stroke.colors) ? cnf.stroke.colors[0] : cnf.stroke.colors || "#fff";
    this.width = 0;
    this.height = 0;
    this._vertical = true;
    this._flip = false;
    this.total = 1;
    this._focusMaxDepth = 0;
    this._focus = null;
    this._zoomGen = 0;
    this._roots = [];
    this._nodesAll = [];
    this._tooltip = new NodeTooltip(w);
    this._graphics = null;
    this._cellsG = null;
    this._labelsG = null;
  }
  /**
   * @param {any[]} series  flattened top-level values (geometry comes from the
   *   config hierarchy; kept for the standard draw(series) signature + noData)
   * @returns {any} SVG group
   */
  draw(series) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    this._graphics = graphics;
    const g = graphics.group({ class: "apexcharts-icicle" });
    if (w.globals.noData || !series || !series.length) return g;
    this.width = w.layout.gridWidth;
    this.height = w.layout.gridHeight;
    if (this.width < 5 || this.height < 5) return g;
    const dir = this.cfg.direction;
    this._vertical = dir !== "right" && dir !== "left";
    this._flip = dir === "up" || dir === "left";
    this._roots = buildHierarchy(this.w);
    if (!this._roots.length) return g;
    this._roots.forEach((r) => fillValues(r));
    sortTree(this._roots, this.cfg.sort);
    if (this.cfg.partition === "strict") {
      validateStrict(this._roots, {
        type: "icicle",
        remedy: "Extents are normalized to fill the parent."
      });
    }
    this._nodesAll = [];
    this._colorNodes();
    this.total = this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1;
    this._tooltip.total = this.total;
    this._cellsG = graphics.group({ class: "apexcharts-icicle-cells" });
    this._labelsG = graphics.group({ class: "apexcharts-icicle-labels" });
    g.add(this._cellsG);
    g.add(this._labelsG);
    this._focus = null;
    this._relayout(this._focus);
    const anims = w.config.chart.animations;
    let mode = "none";
    if (anims.enabled) {
      if (w.globals.dataChanged) {
        if (anims.dynamicAnimation.enabled) mode = "update";
      } else if (!w.globals.resized) {
        mode = "intro";
      }
    }
    this._applyLayout(mode);
    this._renderBreadcrumb();
    return g;
  }
  // --------------------------------------------------------------- colours
  /**
   * Give every node a colour, and collect the nodes flat in draw order.
   *
   * The palette lands on the shallowest level that actually BRANCHES, not on
   * the roots. A single-root tree is the normal shape for an icicle and the
   * only shape for a flame graph, and colouring by root would paint the whole
   * chart one hue; what a reader needs is one hue per branch under that root.
   * Levels above it are the trunk, so they take a pale tone that reads as a
   * container instead of competing with the branches.
   */
  _colorNodes() {
    const colors = this.w.globals.colors || [];
    const fallback = colors[0] || "#008FFB";
    let level = this._roots;
    const trunk = [];
    while (level.length === 1 && level[0].children && level[0].children.length > 1) {
      trunk.push(level[0]);
      level = level[0].children;
    }
    const trunkColor = lighten(fallback, 0.62);
    trunk.forEach((n) => {
      n._color = n.color || trunkColor;
      this._nodesAll.push(n);
    });
    level.forEach((n, i) => {
      colorPass(
        n,
        n.color || colors[i % colors.length] || fallback,
        this.cfg.tint,
        this._nodesAll
      );
    });
  }
  // ---------------------------------------------------------------- layout
  /** The extent of the value axis in px. */
  _valueExtent() {
    return this._vertical ? this.width : this.height;
  }
  /** The extent of the depth axis in px. */
  _depthExtent() {
    return this._vertical ? this.height : this.width;
  }
  /**
   * Recompute visibility + extents for a focus node (null = the whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    const extent = this._valueExtent();
    const maxDepth = this.cfg.maxDepth;
    const capLevels = typeof maxDepth === "number" && maxDepth > 0 ? maxDepth : 0;
    if (focus && this.cfg.zoomType !== "both") {
      const focusDepth = focusChain(focus).length - 1;
      this._focusMaxDepth = placeTree({
        roots: this._roots,
        nodesAll: this._nodesAll,
        focus: null,
        t0: 0,
        t1: extent,
        cap: capLevels ? capLevels - 1 + focusDepth : void 0
      });
      this._stretchTo(focus, extent);
    } else {
      this._focusMaxDepth = placeTree({
        roots: this._roots,
        nodesAll: this._nodesAll,
        focus,
        t0: 0,
        t1: extent,
        cap: capLevels ? capLevels - 1 : void 0
      });
    }
    const depth = this._depthExtent();
    const levels = this._focusMaxDepth + 1;
    const fixed = this.cfg.levelSize === "equal" ? 0 : parseSize(this.cfg.levelSize, depth, 0);
    const used = fixed > 0 ? Math.min(depth, fixed * levels) : depth;
    const scale = bandScale({
      maxDepth: this._focusMaxDepth,
      near: 0,
      far: used,
      gap: 1
    });
    this._nodesAll.forEach((n) => {
      if (!n._show) return;
      n._d0 = scale.near(n._vDepth);
      n._d1 = farEdge(n, scale, this._focusMaxDepth, this.cfg.leaf, used);
    });
  }
  /**
   * Rescale the value axis so the focused branch fills it.
   *
   * This is the whole of a value-axis zoom: one affine map applied to extents
   * that are already laid out, with the depth axis untouched. The branch's
   * ancestors stretch past both edges and are clamped to the plot, which is
   * what makes them read as full-width context bands above the focus.
   *
   * Everything outside the branch lands outside the plot, so it is dropped
   * here rather than drawn off-screen: after the map the focus occupies the
   * entire extent, so a sibling cannot partly survive.
   *
   * @param {any} focus
   * @param {number} extent
   */
  _stretchTo(focus, extent) {
    const span = focus._t1 - focus._t0;
    if (!(span > 0)) return;
    const scale = extent / span;
    const from = focus._t0;
    const eps = 0.01;
    this._nodesAll.forEach((n) => {
      if (!n._show) return;
      const t0 = (n._t0 - from) * scale;
      const t1 = (n._t1 - from) * scale;
      if (t1 <= eps || t0 >= extent - eps) {
        n._show = false;
        return;
      }
      n._t0 = Math.max(0, t0);
      n._t1 = Math.min(extent, t1);
    });
  }
  /**
   * A node's box in plot coordinates.
   *
   * `_t0`/`_t1` run along the value axis and `_d0`/`_d1` along the depth axis;
   * this is the only place that decides which is x and which is y, so the four
   * directions cost one mapping rather than four layouts.
   *
   * @param {{ _t0: number, _t1: number, _d0: number, _d1: number }} n
   * @returns {{ x: number, y: number, w: number, h: number }}
   */
  _box(n) {
    const t = n._t0;
    const len = Math.max(0, n._t1 - n._t0);
    const d = n._d0;
    const thick = Math.max(0, n._d1 - n._d0);
    if (this._vertical) {
      return {
        x: t,
        y: this._flip ? this.height - d - thick : d,
        w: len,
        h: thick
      };
    }
    return {
      x: this._flip ? this.width - d - thick : d,
      y: t,
      w: thick,
      h: len
    };
  }
  // --------------------------------------------------------------- render
  /**
   * Create / update / remove cells to match the current layout, with an
   * animation appropriate to the transition:
   *   intro  — a wipe along the value axis, staggered by depth so the root band
   *            leads and its children follow it out
   *   update — tween every cell from its previous on-screen box (matched by
   *            node key across the re-render); new cells grow in place
   *   zoom   — tween boxes between focus layouts (same instance)
   * @param {'intro'|'zoom'|'update'|'none'} mode
   */
  _applyLayout(mode) {
    const w = this.w;
    const anims = w.config.chart.animations;
    const dur = !anims.enabled ? 0 : mode === "none" ? 0 : mode === "update" || mode === "zoom" ? anims.dynamicAnimation.speed || 350 : anims.speed || 500;
    const gen = ++this._zoomGen;
    const prev = mode === "update" ? (
      /** @type {any} */
      this.ctx._iciclePrevGeoms
    ) : null;
    this._nodesAll.forEach((node) => {
      if (node._show) {
        const to = this._box(node);
        if (!node._el) node._el = this._createCellEl(node);
        node._el.node.setAttribute("data:clipped", String(!!node._clipped));
        this._setCursor(node);
        if (mode === "intro" && dur > 0) {
          this._wipeCell(node, to, dur, gen);
          return;
        }
        let from;
        let isNew = false;
        if (node._cur) {
          from = node._cur;
        } else if (prev && prev.get(node._key)) {
          from = prev.get(node._key);
        } else {
          from = {
            x: to.x + to.w / 2,
            y: to.y + to.h / 2,
            w: 0,
            h: 0
          };
          isNew = true;
        }
        this._animateCell(node, from, to, dur, false, isNew, gen);
      } else if (node._el && node._cur) {
        const c = node._cur;
        const collapsed = {
          x: c.x + c.w / 2,
          y: c.y + c.h / 2,
          w: 0,
          h: 0
        };
        this._animateCell(node, c, collapsed, dur, true, false, gen);
      }
    });
    const geoms = /* @__PURE__ */ new Map();
    this._nodesAll.forEach((n) => {
      if (n._show) geoms.set(n._key, this._box(n));
    });
    this.ctx._iciclePrevGeoms = geoms;
    this._renderLabels(dur);
  }
  /**
   * @param {any} node
   * @returns {any} svg.js rect element
   */
  _createCellEl(node) {
    const box = this._box(node);
    const rect = this._graphics.drawRect(
      box.x,
      box.y,
      0,
      0,
      this.cfg.borderRadius,
      node._color,
      1,
      this.strokeWidth,
      this.strokeColor
    );
    rect.node.setAttribute("class", "apexcharts-icicle-cell");
    const el = rect.node;
    el.setAttribute("data:name", node.name);
    el.setAttribute("data:value", String(node.value));
    el.setAttribute("data:key", morphKey(node._key));
    el.setAttribute(
      "data:leaf",
      String(!(node.children && node.children.length))
    );
    this._tooltip.attach(el, node);
    if (Environment.isBrowser() && this.cfg.zoomOnClick !== false) {
      el.addEventListener("click", () => this._zoomTo(node));
    }
    this._cellsG.add(rect);
    return rect;
  }
  /**
   * Intro: a wipe along the value axis. Each cell grows from its own leading
   * edge, and a deeper band starts later, so the tree reads as unfolding out of
   * the root rather than every level appearing at once.
   *
   * @param {any} node
   * @param {{x:number,y:number,w:number,h:number}} to
   * @param {number} dur
   * @param {number} gen
   */
  _wipeCell(node, to, dur, gen) {
    const el = node._el;
    const levels = this._focusMaxDepth + 1;
    const delay = levels > 1 ? node._vDepth / levels * dur * 0.6 : 0;
    const grow = dur - delay;
    const from = this._vertical ? { x: to.x, y: to.y, w: 0, h: to.h } : { x: to.x, y: to.y, w: to.w, h: 0 };
    this._setBox(el, from);
    el.attr({ opacity: 1 });
    el.node.style.display = "";
    node._cur = from;
    el.animate(grow, delay).during((pos) => {
      if (this._zoomGen !== gen) return;
      const box = {
        x: to.x,
        y: to.y,
        w: this._vertical ? to.w * pos : to.w,
        h: this._vertical ? to.h : to.h * pos
      };
      this._setBox(el, box);
      node._cur = box;
    }).after(() => {
      if (this._zoomGen !== gen) return;
      this._setBox(el, to);
      node._cur = to;
    });
  }
  /**
   * @param {any} node
   * @param {{x:number,y:number,w:number,h:number}} from
   * @param {{x:number,y:number,w:number,h:number}} to
   * @param {number} dur
   * @param {boolean} hide    collapse, then hide
   * @param {boolean} fadeIn  fade 0 -> 1 (new cells only; tweens stay opaque)
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _animateCell(node, from, to, dur, hide, fadeIn, gen) {
    const el = node._el;
    el.attr({ fill: node._color });
    if (dur === 0) {
      this._setBox(el, to);
      el.attr({ opacity: hide ? 0 : 1 });
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
      const box = {
        x: lerp(from.x, to.x, pos),
        y: lerp(from.y, to.y, pos),
        w: lerp(from.w, to.w, pos),
        h: lerp(from.h, to.h, pos)
      };
      this._setBox(el, box);
      el.attr({ opacity: lerp(startOp, endOp, pos) });
      node._cur = box;
    }).after(() => {
      if (this._zoomGen !== gen) return;
      if (hide) {
        el.node.style.display = "none";
        node._cur = null;
      } else {
        this._setBox(el, to);
        node._cur = to;
      }
    });
  }
  /**
   * Write a box onto a cell, with `spacing` taken out of it.
   *
   * The gap is applied here rather than in the layout so the extents stay the
   * true partition: a tween interpolates real geometry and the gap never
   * accumulates across frames. It is clamped so a thin cell cannot invert.
   *
   * @param {any} el
   * @param {{x:number,y:number,w:number,h:number}} box
   */
  _setBox(el, box) {
    const gap = this.cfg.spacing || 0;
    const insetX = Math.min(gap, Math.max(0, box.w - 0.5)) / 2;
    const insetY = Math.min(gap, Math.max(0, box.h - 0.5)) / 2;
    el.attr({
      x: box.x + insetX,
      y: box.y + insetY,
      width: Math.max(0, box.w - insetX * 2),
      height: Math.max(0, box.h - insetY * 2)
    });
  }
  // ---------------------------------------------------------------- labels
  /**
   * Labels are overlays on animated cells, so they reveal AFTER the cells
   * settle (repo convention: overlays never pop in over a moving shape).
   * @param {number} dur  cell animation duration (0 = instant labels)
   */
  _renderLabels(dur) {
    const labelsG = this._labelsG;
    while (labelsG.node.firstChild) {
      labelsG.node.removeChild(labelsG.node.firstChild);
    }
    if (!this.cfg.dataLabels.show) return;
    this._nodesAll.forEach((node) => {
      if (!node._show) return;
      this._renderLabel(node);
      if (node._clipped) this._renderMoreMark(node);
    });
    if (dur > 0) {
      labelsG.attr({ opacity: 0 });
      labelsG.animate(250, dur).attr({ opacity: 1 });
    } else {
      labelsG.attr({ opacity: 1 });
    }
  }
  /**
   * One cell's label, horizontal wherever there is room for it.
   *
   * A cell taller than it is wide (what a sideways icicle produces) turns its
   * label a quarter turn, because a flat label there is clipped by the band
   * thickness while the value axis has room to spare.
   *
   * @param {any} node
   */
  _renderLabel(node) {
    if (!Environment.isBrowser()) return;
    const dl = this.cfg.dataLabels;
    const style = dl.style;
    const box = this._box(node);
    const rotated = dl.rotate === "always" ? true : dl.rotate === "never" ? false : box.h > box.w;
    const along = rotated ? box.h : box.w;
    const across = rotated ? box.w : box.h;
    const fontPx = parseFloat(style.fontSize) || 12;
    if (along < dl.minSizeToShow) return;
    if (across < fontPx + 2) return;
    const room = along - 8;
    let label = node.name;
    if (dl.showValue) {
      const full = `${node.name}: ${node.value}`;
      if (this._fits(full, room, fontPx)) label = full;
    }
    const text = this._truncate(label, room, fontPx);
    if (!text) return;
    const colors = style.colors;
    const fill = (Array.isArray(colors) ? colors[0] : colors) || "#fff";
    const el = BrowserAPIs.createElementNS(SVGNS, "text");
    el.setAttribute("font-size", style.fontSize || "12px");
    if (style.fontFamily) el.setAttribute("font-family", style.fontFamily);
    el.setAttribute("font-weight", String(style.fontWeight || 400));
    el.setAttribute("fill", fill);
    el.setAttribute("dominant-baseline", "central");
    el.style.pointerEvents = "none";
    el.textContent = text;
    const pad = 4;
    const anchor = dl.align === "center" ? "middle" : dl.align === "right" ? "end" : "start";
    const atStart = box.x + pad;
    const atEnd = box.x + box.w - pad;
    const mid = box.x + box.w / 2;
    if (rotated) {
      const cx = box.x + box.w / 2;
      const yStart = box.y + box.h - pad;
      const yEnd = box.y + pad;
      const yMid = box.y + box.h / 2;
      const y = anchor === "middle" ? yMid : anchor === "end" ? yEnd : yStart;
      el.setAttribute("text-anchor", anchor);
      el.setAttribute("x", String(cx));
      el.setAttribute("y", String(y));
      el.setAttribute("transform", `rotate(-90 ${cx} ${y})`);
    } else {
      const x = anchor === "middle" ? mid : anchor === "end" ? atEnd : atStart;
      el.setAttribute("text-anchor", anchor);
      el.setAttribute("x", String(x));
      el.setAttribute("y", String(box.y + box.h / 2));
    }
    this._labelsG.node.appendChild(el);
  }
  /**
   * A row of dots on the far edge of a branch whose children `maxDepth` cut.
   *
   * Without it a clipped branch is indistinguishable from a leaf, and the chart
   * would quietly claim the tree ends there. The dots sit on the edge the
   * children would have been drawn against, so they read as "it continues this
   * way", and clicking the cell zooms in and shows them.
   *
   * @param {any} node
   */
  _renderMoreMark(node) {
    if (!Environment.isBrowser()) return;
    const box = this._box(node);
    const along = this._vertical ? box.w : box.h;
    if (along < 18) return;
    const mid = this._vertical ? box.x + box.w / 2 : box.y + box.h / 2;
    const edge = this._vertical ? this._flip ? box.y + 2.5 : box.y + box.h - 2.5 : this._flip ? box.x + 2.5 : box.x + box.w - 2.5;
    const g = BrowserAPIs.createElementNS(SVGNS, "g");
    g.setAttribute("class", "apexcharts-icicle-more");
    g.style.pointerEvents = "none";
    for (let i = -1; i <= 1; i++) {
      const dot = BrowserAPIs.createElementNS(SVGNS, "circle");
      dot.setAttribute("cx", String(this._vertical ? mid + i * 5 : edge));
      dot.setAttribute("cy", String(this._vertical ? edge : mid + i * 5));
      dot.setAttribute("r", "1.1");
      dot.setAttribute("fill", "#fff");
      dot.setAttribute("fill-opacity", "0.85");
      g.appendChild(dot);
    }
    this._labelsG.node.appendChild(g);
  }
  /**
   * Whether a string fits the room available, at this font size.
   * @param {string} text
   * @param {number} room  px
   * @param {number} fontPx
   * @returns {boolean}
   */
  _fits(text, room, fontPx) {
    return text.length * fontPx * 0.58 <= room;
  }
  /**
   * Trim a label to the room available along its reading direction.
   *
   * Below a few surviving characters it returns nothing at all. A stub like
   * `Opera…` or, worse, `R…` is noise: it neither names the cell nor leaves it
   * clean, and a wall of them is what makes a deep icicle look cluttered. The
   * cell still answers on hover.
   *
   * @param {string} name
   * @param {number} room  px
   * @param {number} fontPx
   * @returns {string}
   */
  _truncate(name, room, fontPx) {
    const charW = fontPx * 0.58;
    const maxChars = Math.floor(room / charW);
    if (maxChars >= name.length) return name;
    if (maxChars < MIN_LABEL_CHARS + 1) return "";
    return name.slice(0, maxChars - 1) + "…";
  }
  // ----------------------------------------------------------------- zoom
  /**
   * A cell offers the pointer only while clicking it would change the view.
   * A leaf under the current focus, or the single root of a one-root tree,
   * resolves to the focus the reader is already on, and a pointer there
   * promises a zoom that cannot happen. Asked on every layout, because a zoom
   * changes the answer for every cell.
   * @param {any} node
   */
  _setCursor(node) {
    if (!Environment.isBrowser() || this.cfg.zoomOnClick === false) return;
    node._el.node.style.cursor = resolveFocus(node, this._focus, this._roots).changed ? "pointer" : "default";
  }
  /**
   * Focus a node (zoom in), or zoom out one level when the current focus is
   * clicked.
   * @param {any} node
   */
  _zoomTo(node) {
    if (this.cfg.zoomOnClick === false) return;
    const next = resolveFocus(node, this._focus, this._roots);
    if (!next.changed) return;
    this._focus = next.focus;
    this._relayout(this._focus);
    this._applyLayout("zoom");
    this._renderBreadcrumb();
  }
  /**
   * The breadcrumb sits in the band the layout reserved for it, rather than
   * floating: an icicle fills its plot edge to edge, so an overlay would have
   * nowhere to go without covering a cell. Same reasoning as the treemap's,
   * and it shares the same renderer.
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return;
    if (!this._focus) {
      clearBreadcrumb(this.w);
      return;
    }
    const cfg = breadcrumbConfig(this.w);
    const soleRoot = this._roots.length === 1 ? this._roots[0] : null;
    const crumbs = (soleRoot ? [] : [{ label: "All", data: null }]).concat(
      focusChain(this._focus).map((n) => ({ label: n.name, data: n }))
    );
    const nav = renderBreadcrumb(this.w, {
      crumbs,
      ariaLabel: "Icicle breadcrumb",
      config: cfg,
      compact: true,
      onNavigate: (i, crumb) => {
        this._focus = crumb.data === soleRoot ? null : crumb.data;
        this._relayout(this._focus);
        this._applyLayout("zoom");
        this._renderBreadcrumb();
      }
    });
    if (nav) placeInReservedBand(this.w, this.ctx, nav, cfg);
  }
}
_core__default.use({
  icicle: IcicleChart
});
export {
  default2 as default
};
