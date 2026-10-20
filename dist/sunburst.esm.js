/*!
 * ApexCharts v8.4.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const Environment = _core.__apex_Environment_Environment;
const D2R$1 = Math.PI / 180;
const R2D$1 = 180 / Math.PI;
function arcPoint(cx, cy, radius, deg) {
  return {
    x: cx + radius * Math.cos((deg - 90) * D2R$1),
    y: cy + radius * Math.sin((deg - 90) * D2R$1)
  };
}
const xy = (p) => `${p.x} ${p.y}`;
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
const Animations = _core.__apex_Animations;
function drilldownById(w, id) {
  const dd = w.config.drilldown;
  const list = dd && Array.isArray(dd.series) ? dd.series : [];
  return list.find((s) => s && s.id === id);
}
function segment(name, seen) {
  var _a;
  const n = String(name).replace(/\//g, "%2F");
  const o = ((_a = seen.get(n)) != null ? _a : -1) + 1;
  seen.set(n, o);
  return `${o}:${n}`;
}
function toNode(w, d, i, paletteFromParent, parentKey, seenIds = null, opts = {}, seen = /* @__PURE__ */ new Map()) {
  var _a, _b, _c;
  const isObj = d && typeof d === "object";
  const name = isObj ? (_b = (_a = d.x) != null ? _a : d.name) != null ? _b : "" : "";
  const raw = isObj ? (_c = d.y) != null ? _c : d.value : d;
  const value = raw == null || raw === "" ? NaN : Number(raw);
  const node = {
    name: String(name),
    value: isNaN(value) ? null : value,
    color: isObj && d.color ? d.color : void 0,
    _key: `${parentKey}/${segment(name, seen)}`
  };
  if (paletteFromParent && !node.color) {
    node.color = paletteFromParent[i % paletteFromParent.length];
  }
  if (opts.keepDatum) node._datum = d;
  const kids = /* @__PURE__ */ new Map();
  if (isObj && Array.isArray(d.children) && d.children.length) {
    node.children = d.children.map(
      (c, j) => toNode(w, c, j, null, node._key, seenIds, opts, kids)
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
          (c, j) => toNode(w, c, j, palette, node._key, nextSeen, opts, kids)
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
  const seen = /* @__PURE__ */ new Map();
  return data.map(
    (d, i) => toNode(w, d, i, null, "", null, opts, seen)
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
function breadcrumbConfig(w, localCfg) {
  const shared = w.config.drilldown && w.config.drilldown.breadcrumb || {};
  return Object.assign(
    {
      show: true,
      position: "top-left",
      separator: " / ",
      rootLabel: "All",
      offsetX: 0,
      offsetY: 0,
      formatter: void 0
    },
    shared,
    localCfg
  );
}
function avoidChromeOverlap(w, nav) {
  const chrome = (
    /** @type {Element[]} */
    [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s) => w.dom.baseEl.querySelector(s)).filter((el) => el !== null)
  );
  if (!chrome.length) return;
  const wrapTop = w.dom.elWrap.getBoundingClientRect().top;
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
    btn.addEventListener("click", (e) => opts.onNavigate(i, crumb, e));
    nav.appendChild(btn);
  });
  elWrap.appendChild(nav);
  return nav;
}
function refocusBreadcrumb(w, e) {
  var _a, _b, _c;
  if (e.detail) return;
  const el = ((_a = w.dom.elWrap) == null ? void 0 : _a.querySelector(".apexcharts-breadcrumb-item")) || ((_b = w.dom.Paper) == null ? void 0 : _b.node);
  (_c = el == null ? void 0 : el.focus) == null ? void 0 : _c.call(el);
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
const strictWarned = /* @__PURE__ */ new Set();
function validateStrict(roots, { type, remedy }) {
  let msg = "";
  const walk = (node) => {
    var _a;
    if (msg || !((_a = node.children) == null ? void 0 : _a.length)) return;
    const sum = node.children.reduce(
      (s, c) => s + Math.max(0, c.value || 0),
      0
    );
    const v = node.value;
    if (v != null && Math.abs(sum - v) > 1e-6 * Math.max(Math.abs(v), sum)) {
      msg = `ApexCharts ${type}: partition 'strict' but "${node.name}" (${v}) != sum of its children (${sum}). ${remedy}`;
    }
    node.children.forEach(walk);
  };
  roots.forEach(walk);
  if (msg && !strictWarned.has(msg)) {
    if (strictWarned.size > 99) strictWarned.clear();
    strictWarned.add(msg);
    console.warn(msg);
  }
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
function focusTrail(roots, focus) {
  const sole = roots.length === 1 ? roots[0] : null;
  const trail = focusChain(focus).map((n) => ({
    label: n.name,
    data: n,
    focus: n === sole ? null : n
  }));
  return sole ? trail : [{ data: null, focus: null }].concat(trail);
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
function focusByKey(key, nodesAll, roots) {
  var _a;
  if (!key) return null;
  nodesAll.forEach(
    (n) => {
      var _a2;
      return (_a2 = n.children) == null ? void 0 : _a2.forEach((c) => c._parent = n);
    }
  );
  const f = nodesAll.find((n) => n._key === key);
  return f && ((_a = f.children) == null ? void 0 : _a.length) && !(roots.length === 1 && f === roots[0]) ? f : null;
}
function setZoomCursor(chart, node) {
  if (!Environment.isBrowser() || chart.cfg.zoomOnClick === false) return;
  node._el.node.style.cursor = resolveFocus(node, chart._focus, chart._roots).changed ? "pointer" : "default";
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
  amount = amount > 0 ? Math.min(amount, 1) : 0;
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
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
class NodeTooltip {
  /**
   * @param {any} w
   * @param {any} [ctx] chart instance, handed to tooltip.custom as core does
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
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
    var _a;
    const t = this._tip();
    if (!t) return;
    const w = this.w;
    const pctTotal = (node.value / this.total * 100).toFixed(1);
    const parentVal = node._parent ? node._parent.value : this.total;
    const pctParent = parentVal > 0 ? (node.value / parentVal * 100).toFixed(1) : pctTotal;
    let fn = w.config.tooltip.custom;
    if (Array.isArray(fn)) fn = fn[0];
    const out = typeof fn === "function" && fn({
      series: w.seriesData.series,
      seriesIndex: 0,
      dataPointIndex: -1,
      w,
      ctx: this.ctx,
      node,
      percentOfParent: +pctParent,
      percentOfTotal: +pctTotal
    });
    if (out == null ? void 0 : out.nodeName) {
      t.replaceChildren(out.cloneNode(true));
    } else if (typeof out === "string" || typeof out === "number") {
      t.innerHTML = out;
    } else {
      const ty = w.config.tooltip.y;
      const fmt = (_a = Array.isArray(ty) ? ty[0] : ty) == null ? void 0 : _a.formatter;
      const val = fmt ? fmt(node.value, { seriesIndex: 0, dataPointIndex: -1, w, node }) : +node.value.toPrecision(12);
      t.innerHTML = `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex"><span class="apexcharts-tooltip-marker"></span><div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${escapeHtml(node.name)}: </span><span class="apexcharts-tooltip-text-y-value">${val} (${pctParent}% of parent, ${pctTotal}% of total)</span></div></div></div>`;
      const group = (
        /** @type {HTMLElement} */
        t.firstChild
      );
      const marker = (
        /** @type {HTMLElement} */
        group.firstChild
      );
      marker.style.backgroundColor = node._color;
      if (w.config.tooltip.fillSeriesColor) {
        group.style.backgroundColor = node._color;
      }
    }
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
const CHAR_W_EM = 0.58;
const lerp = (a, b, t) => a + (b - a) * t;
function resolveMode(w) {
  const anims = w.config.chart.animations;
  if (!anims.enabled) return "none";
  if (w.globals.dataChanged) {
    return anims.dynamicAnimation.enabled && w.globals.shouldAnimate !== false ? "update" : "none";
  }
  return w.globals.resized ? "none" : "intro";
}
function durationFor(w, mode) {
  var _a, _b;
  const anims = w.config.chart.animations;
  if (!anims.enabled || mode === "none") return 0;
  if (mode === "intro") return (_a = anims.speed) != null ? _a : 500;
  const dyn = anims.dynamicAnimation;
  return dyn.enabled ? (_b = dyn.speed) != null ? _b : 350 : 0;
}
function fadeInAfter(group, dur, alive) {
  group.attr({ opacity: dur > 0 ? 0 : 1 });
  if (dur > 0) {
    group.animate(250, dur).during((p) => {
      if (alive()) group.attr({ opacity: p });
    });
  }
}
function handOffGeoms(ctx, slot, nodes, entry) {
  const geoms = /* @__PURE__ */ new Map();
  nodes.forEach((n) => {
    const e = entry(n);
    if (e) geoms.set(n._key, e);
  });
  ctx[slot] = geoms;
}
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const SVGNS = "http://www.w3.org/2000/svg";
class SunburstChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    const cnf = w.config;
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
    this._tooltip = new NodeTooltip(w, this.ctx);
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
    const w = this.w;
    const graphics = new Graphics(this.w);
    this._graphics = graphics;
    const g = graphics.group({ class: "apexcharts-sunburst" });
    if (w.globals.noData || !series || !series.length) return g;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    this.centerX = gw / 2 + (this.cfg.offsetX || 0);
    this.centerY = gh / 2 + (this.cfg.offsetY || 0);
    this.maxRadius = Math.min(gw, gh) / 2.05 - this.strokeWidth - (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0);
    if (this.maxRadius < 5) return g;
    this._roots = buildHierarchy(w);
    if (!this._roots.length) return g;
    this._roots.forEach(fillValues);
    this._validateStrict();
    this._nodesAll = [];
    const colors = w.globals.colors || [];
    this._roots.forEach((r, i) => {
      colorPass(
        r,
        r.color || colors[i % colors.length] || "#008FFB",
        this.cfg.tint,
        this._nodesAll
      );
    });
    this.total = this._roots.reduce((s, r) => s + Math.max(0, r.value), 0) || 1;
    this._tooltip.total = this.total;
    this._ringsG = graphics.group({ class: "apexcharts-sunburst-rings" });
    this._labelsG = graphics.group({ class: "apexcharts-sunburst-labels" });
    g.add(this._ringsG);
    g.add(this._labelsG);
    this._focus = focusByKey(
      w.globals.sunburstFocusKey,
      this._nodesAll,
      this._roots
    );
    this._relayout(this._focus);
    this._applyLayout(resolveMode(w));
    this._renderBreadcrumb();
    return g;
  }
  // ------------------------------------------------------------------ data
  /**
   * With `partition: 'strict'`, warn (once) when a parent's value does not
   * match the sum of its children. The angles are still normalized to fill the
   * wedge (strict rendering is a P3 refinement); this just surfaces the data
   * mismatch.
   */
  _validateStrict() {
    if (this.cfg.partition !== "strict") return;
    validateStrict(this._roots, {
      type: "sunburst",
      remedy: "Angles are normalized to fill the wedge."
    });
  }
  // ---------------------------------------------------------------- layout
  /**
   * Recompute visibility + angles + radii for a focus node (null = whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    this.w.globals.sunburstFocusKey = focus && focus._key;
    this._focusMaxDepth = placeTree({
      roots: this._roots,
      nodesAll: this._nodesAll,
      focus,
      t0: this.startAngle,
      t1: this.endAngle
    });
    const hole = parseSize(this.cfg.innerSize, this.maxRadius, 0.15);
    const scale = bandScale({
      maxDepth: this._focusMaxDepth,
      near: hole,
      far: this.maxRadius,
      gap: 1
    });
    this._innerR = scale.near;
    this._outerR = scale.far;
    this._nodesAll.forEach((n) => {
      if (!n._show) return;
      n._iR = scale.near(n._vDepth);
      n._oR = farEdge(
        n,
        scale,
        this._focusMaxDepth,
        this.cfg.leaf,
        this.maxRadius
      );
    });
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
    const w = this.w;
    const dur = durationFor(w, mode);
    const gen = ++this._zoomGen;
    const morph = (
      /** @type {any} */
      (_a = this.ctx) == null ? void 0 : _a.morphTypeChange
    );
    const morphActive = mode !== "zoom" && !!morph && typeof morph.isActive === "function" && morph.isActive() && typeof morph.getInitialPathAt === "function";
    const morphDur = morphActive ? morph.getSpeed() : 0;
    this._morphLeafIndex = 0;
    const prev = mode === "update" ? (
      /** @type {any} */
      this.ctx._sunburstPrevGeoms
    ) : null;
    const geo = (n) => n._cur || { a0: n._t0, a1: n._t1, iR: n._iR, oR: n._oR };
    const pinch = (c) => {
      const m = (c.a0 + c.a1) / 2;
      return { a0: m, a1: m, iR: c.iR, oR: c.iR };
    };
    this._nodesAll.forEach((node) => {
      if (node._show) {
        const target = {
          a0: node._t0,
          a1: node._t1,
          iR: node._iR,
          oR: node._oR
        };
        if (!node._el) node._el = this._createArcEl(node);
        setZoomCursor(this, node);
        const morphFrom = morphActive ? this._morphSourceFor(node) : null;
        const p = prev && prev.get(node._key);
        if (p && this._midMorph(p)) this._adopt(node, p);
        if (morphFrom && morphDur > 0) {
          this._morphArcFrom(node, morphFrom, target, morphDur, gen);
        } else if (this._midMorph(node)) {
          this._continueMorph(node, target, dur, gen);
        } else if ((mode === "intro" || morphActive) && dur > 0) {
          this._sweepArc(node, target, morphActive ? morphDur : dur, gen);
        } else {
          const from = node._cur || (p ? geo(p) : pinch(target));
          this._animateArc(node, from, target, dur, false, !node._cur && !p, gen);
        }
      } else if (node._el && this._midMorph(node)) {
        this._continueMorph(node, null, dur, gen);
      } else if (node._el && node._cur) {
        this._animateArc(node, node._cur, pinch(node._cur), dur, true, false, gen);
      }
    });
    if (prev && dur && !morphActive) {
      const keys = new Set(this._nodesAll.map((n) => n._show && n._key));
      prev.forEach((p, k) => {
        if (keys.has(k) || !(p._show || p._cur)) return;
        const el = this._graphics.drawPath({
          fill: p._color,
          stroke: this.strokeColor,
          strokeWidth: this.strokeWidth,
          classes: "apexcharts-sunburst-arc"
        });
        el.node.setAttribute("data:name", p.name);
        this._ringsG.add(el.attr({ opacity: p._el.attr("opacity") }));
        const c = geo(p);
        const g = { _el: el, _color: p._color, name: p.name, _key: k, _cur: c };
        this._nodesAll.push(g);
        if (this._midMorph(p)) {
          this._adopt(g, p);
          this._continueMorph(g, null, dur, gen);
        } else this._animateArc(g, c, pinch(c), dur, true, false, gen);
      });
    }
    const end = Math.max(dur, morphDur);
    if (end) {
      this._ringsG.animate(end).after(() => {
        if (this._zoomGen === gen && this._ringsG.node.isConnected)
          new Animations(
            w,
            /** @type {any} */
            this.ctx
          ).animationCompleted(
            this._ringsG.node
          );
      });
    } else w.globals.animationEnded = true;
    handOffGeoms(
      this.ctx,
      "_sunburstPrevGeoms",
      this._nodesAll,
      (n) => n._show || n._cur ? n : null
    );
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
    node._pathEnd = this.w.globals.shouldAnimate ? performance.now() + dur : 0;
    new Animations(
      this.w,
      /** @type {any} */
      this.ctx
    ).morphSVG(
      this._gated(el, gen),
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
   * The arc's element as seen by a tween this pass starts: once a newer
   * layout supersedes the pass, its writes are dropped (reads still pass), so
   * a runner with no generation check of its own, like morphSVG's, stops
   * fighting the newer pass for the path and cannot land on a stale arc.
   * @param {any} el
   * @param {number} gen
   * @returns {any}
   */
  _gated(el, gen) {
    const live = Object.create(el);
    live.attr = (...a) => this._zoomGen === gen || a.length === 1 && typeof a[0] === "string" ? el.attr(...a) : live;
    return live;
  }
  /**
   * Whether a path tween (a cross-type morph, or a zoom that took one over)
   * is still reshaping this arc.
   * @param {any} node
   */
  _midMorph(node) {
    return node._pathEnd > 0 && node._pathEnd > performance.now();
  }
  /**
   * Hand a previous render's mid-path arc over to this render's element: its
   * shape and opacity as they are on screen, and the path tween still due.
   * @param {any} node
   * @param {any} p  the previous render's node
   */
  _adopt(node, p) {
    node._el.attr({ d: p._el.attr("d"), opacity: p._el.attr("opacity") });
    node._pathEnd = p._pathEnd;
  }
  /**
   * Take over an arc a superseded path tween is still reshaping. What is on
   * screen is part-way from a tile to an arc, which arc parameters cannot
   * express, so it carries on as a path tween from exactly there to the new
   * target on this pass's clock, resampled as the morph was. An arc this pass
   * hides fades out where it is.
   * @param {any} node
   * @param {{a0:number,a1:number,iR:number,oR:number} | null} to  null hides
   * @param {number} dur
   * @param {number} gen
   */
  _continueMorph(node, to, dur, gen) {
    const el = node._el;
    const toD = to && this._arcPath(to.iR, to.oR, to.a0, to.a1, this.cfg.borderRadius);
    if (to) node._cur = to;
    node._pathEnd = dur ? performance.now() + dur : 0;
    const land = () => {
      if (to) return;
      el.node.style.display = "none";
      node._cur = null;
    };
    if (!dur) {
      if (to) el.attr({ d: toD, opacity: 1 });
      land();
      return;
    }
    el.node.style.display = "";
    const run = this._gated(el, gen).animate(dur);
    if (to) run.plot(toD, "polygons");
    run.attr({ opacity: to ? 1 : 0 }).after(() => {
      if (this._zoomGen === gen) land();
    });
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
      fill: node._color,
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
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
    this._tooltip.attach(el, node);
    if (Environment.isBrowser() && this.cfg.zoomOnClick !== false) {
      el.addEventListener("click", () => this._zoomTo(node));
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
    if (!this.cfg.dataLabels.show || this.w.config.dataLabels.enabled === false)
      return;
    this._nodesAll.forEach((node) => {
      if (!node._show) return;
      if (node._t1 - node._t0 < this.cfg.dataLabels.minAngleToShow) return;
      this._renderCurvedLabel(node);
    });
    const gen = this._zoomGen;
    fadeInAfter(labelsG, dur, () => this._zoomGen === gen);
  }
  /**
   * Curved label along the arc's mid-radius (flipped on the bottom half so it
   * stays upright). Raw SVG <textPath> — svg.js has no first-class textPath.
   * @param {any} node
   */
  _renderCurvedLabel(node) {
    const style = this.cfg.dataLabels.style;
    const w = this.w;
    const r = (node._iR + node._oR) / 2;
    const mid = ((node._t0 + node._t1) / 2 % 360 + 360) % 360;
    const flip = mid > 90 && mid < 270;
    const padDeg = Math.min(r > 0 ? 4 / r * R2D : 0, (node._t1 - node._t0) / 2);
    const from = flip ? node._t1 - padDeg : node._t0 + padDeg;
    const to = flip ? node._t0 + padDeg : node._t1 - padDeg;
    const p1 = this._ptAt(r, from);
    const p2 = this._ptAt(r, to);
    const largeArc = Math.abs(to - from) > 180 ? 1 : 0;
    const sweep = flip ? 0 : 1;
    const id = `apx-sb-lbl-${w.globals.cuid}-${this._lblSeq++}`;
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
    tp.textContent = this._truncate(node.name, r, node._t1 - node._t0, style.fontSize);
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
    const charW = (parseFloat(fontSize) || 12) * CHAR_W_EM;
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
    const next = resolveFocus(node, this._focus, this._roots);
    if (next.changed) this._focusOn(next.focus);
  }
  /**
   * @param {any} focus  null = the whole tree
   */
  _focusOn(focus) {
    this._focus = focus;
    this._relayout(focus);
    this._applyLayout("zoom");
    this._renderBreadcrumb();
  }
  /**
   * The zoom breadcrumb, on the renderer the treemap, icicle and drilldown
   * share, so it honours `drilldown.breadcrumb` and carries the same markup and
   * semantics. It floats over a corner rather than sitting in a reserved band:
   * the rings leave the corners empty.
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return;
    if (!this._focus) {
      clearBreadcrumb(this.w);
      return;
    }
    const nav = renderBreadcrumb(this.w, {
      crumbs: focusTrail(this._roots, this._focus),
      ariaLabel: "Sunburst breadcrumb",
      onNavigate: (i, crumb, e) => {
        this._focusOn(crumb.focus);
        refocusBreadcrumb(this.w, e);
      }
    });
    if (nav) avoidChromeOverlap(this.w, nav);
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
}
_core__default.use({
  sunburst: SunburstChart
});
export {
  default2 as default
};
