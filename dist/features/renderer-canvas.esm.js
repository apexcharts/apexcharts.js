/*!
 * ApexCharts v6.2.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
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
  constructor(g, i) {
    this.__isCanvasMark = true;
    this._g = g;
    this._i = i;
  }
  get node() {
    return SHARED_MARKER_NODE;
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a, v) {
    if (typeof a === "string") {
      if (a === "fill" && v !== void 0) this._g._setMarkerFill(this._i, v);
      return v === void 0 ? null : this;
    }
    if (a && a.fill !== void 0) this._g._setMarkerFill(this._i, a.fill);
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
  attr(a, v) {
    if (typeof a === "string") {
      if (v === void 0) return null;
      this._applyAttr(a, v);
      return this;
    }
    for (const k in a) {
      if (a[k] !== void 0) this._applyAttr(k, a[k]);
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
    for (let i = 0; i < series.length; i++) {
      const d = series[i] && series[i].data;
      if (Array.isArray(d)) cap += d.length;
    }
    cap = Math.ceil(cap * 1.15) + 16;
    if (cap > this._mcap) this._allocMarkers(cap);
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
  _setMarkerFill(i, fill) {
    const base = this._mstyle[i];
    if (fill === this._lofFill && base === this._lofBase) {
      this._mstyle[i] = this._lofId;
      return;
    }
    const s = this._styles[base];
    if (!s || s.fill === fill) {
      this._lofFill = fill;
      this._lofBase = base;
      this._lofId = base;
      return;
    }
    const id = this._internStyle(
      fill,
      s.stroke,
      s.strokeWidth,
      s.strokeDash,
      s.fillOpacity,
      s.strokeOpacity
    );
    this._mstyle[i] = id;
    this._lofFill = fill;
    this._lofBase = base;
    this._lofId = id;
  }
  /** @param {number} i @returns {any} the style object for a marker index */
  markerStyle(i) {
    return this._styles[this._mstyle[i]];
  }
  /** @param {number} i @returns {number} series (realIndex) of a marker, -1 if none */
  markerSeries(i) {
    return this._msi[i];
  }
  /** @param {number} id @returns {string} */
  shapeName(id) {
    return SHAPE_NAME[id] || "circle";
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
    const i = this._mn++;
    this._mx[i] = x || 0;
    this._my[i] = typeof y === "number" ? y : NaN;
    this._msize[i] = opts.pSize || 0;
    this._mshape[i] = (_a = SHAPE_ID[opts.shape || "circle"]) != null ? _a : 0;
    this._mstyle[i] = styleId;
    this._msi[i] = opts.seriesIndex == null ? -1 : opts.seriesIndex;
    return new CanvasMarkerRef(this, i);
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
const SVGElement = _core.__apex_SVGElement;
const SVGNS = _core.__apex_math_SVGNS;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
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
    const h = gh + margin * 2;
    const fo = BrowserAPIs.createElementNS(SVGNS, "foreignObject");
    fo.setAttribute("x", String(-margin));
    fo.setAttribute("y", String(-margin));
    fo.setAttribute("width", String(w));
    fo.setAttribute("height", String(h));
    fo.setAttribute("class", "apexcharts-canvas-series");
    fo.style.overflow = "visible";
    const canvas = (
      /** @type {any} */
      BrowserAPIs.createElement("canvas")
    );
    canvas.setAttribute("class", "apexcharts-series-canvas");
    canvas.width = Math.max(1, Math.round(w * this._dpr));
    canvas.height = Math.max(1, Math.round(h * this._dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
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
      const ordered = list.length > 1 ? list.map((c, i) => [c, i]).sort(
        (a, b) => a[0].z === b[0].z ? a[1] - b[1] : a[0].z - b[0].z
      ).map((pair) => pair[0]) : list;
      for (let i = 0; i < ordered.length; i++) {
        const c = ordered[i];
        this._alpha = this._dim ? this._seriesAlpha(c.si) : 1;
        this._paintOne(ctx, c);
      }
    }
    this._paintMarkers(ctx, shim);
    this._alpha = 1;
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
      } catch (e) {
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
    const n = shim.markerCount();
    if (!n) return;
    const mx = shim._mx;
    const my = shim._my;
    const msize = shim._msize;
    const mshape = shim._mshape;
    const mstyle = shim._mstyle;
    const dimming = !!this._dim;
    if (!dimming) this._alpha = 1;
    let i = 0;
    while (i < n) {
      const styleId = mstyle[i];
      const shapeId = mshape[i];
      const style = shim.markerStyle(i);
      if (!style) {
        i++;
        continue;
      }
      const doFill = this._applyFill(ctx, style);
      const doStroke = this._applyStroke(ctx, style);
      this._markerBatches++;
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity);
      const baseStrokeA = style.strokeOpacity == null ? 1 : Number(style.strokeOpacity);
      if (shapeId === 0) {
        let j = i;
        while (j < n && mshape[j] === 0 && mstyle[j] === styleId) {
          const r = msize[j] || 0;
          const y = my[j];
          if (r > 0 && y === y) {
            ctx.beginPath();
            ctx.arc(mx[j], y, r, 0, TWO_PI);
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
        i = j;
      } else {
        const dpr = this._dpr;
        const m = this._margin;
        let j = i;
        while (j < n && mshape[j] === shapeId && mstyle[j] === styleId) {
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
        i = j;
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
    const n = xs.length;
    if (!n) return;
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let k = 1; k < n; k++) {
      ctx.lineTo(xs[k], ys[k]);
    }
    if (cmd.ncloseY != null) {
      ctx.lineTo(xs[n - 1], cmd.ncloseY);
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
          } catch (e) {
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
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r, attrs) {
    return this._g.drawCircle(r, attrs);
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
  // Shared tooltip/zoom/click resolve via coordinate lookup (pointsArray), so
  // there is no per-mark hit surface to query; hitTest stays a no-op unless a
  // future per-point feature needs it.
  /**
   * @param {number} _px
   * @param {number} _py
   */
  hitTest(_px, _py) {
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
_core__default.registerRenderer(
  "canvas",
  /**
   * @param {any} w
   * @param {any} ctx
   */
  (w, ctx) => new CanvasRenderer(w, ctx)
);
export {
  default2 as default
};
