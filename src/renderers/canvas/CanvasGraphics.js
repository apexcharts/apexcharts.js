// @ts-check
import Graphics from '../../modules/Graphics'

/**
 * Strata (#2) P2: CanvasGraphics: an svg.js-compatible display-list shim.
 *
 * The per-type `draw()` methods emit series marks by calling primitive methods
 * (`renderPaths`, `drawMarker`, ...) and then reading back from the returned
 * element (`.attr()`, `.node.setAttribute()`, `.add()`, filter/animation
 * helpers). Rather than hoist a scene description out of those tangled sites,
 * the canvas renderer implements the SAME element API, but instead of creating
 * a DOM node it records a paint command. The returned handle quacks like an
 * svg.js element so the emit sites need no structural change.
 *
 * PERFORMANCE: the whole point of canvas mode is dense data, so the per-point
 * primitive (`drawMarker`) MUST NOT allocate a retained object per point.
 * Allocating tens of thousands of retained objects into a growing array while
 * the render pipeline churns transient garbage triggers a V8 scavenge blow-up
 * (measured: 50k object-cmds = ~5s, columnar number arrays = a few ms). So
 * markers are stored COLUMNAR: parallel unboxed-number arrays (x/y/size/shape/
 * styleId) plus a tiny deduped style palette. The returned handle is a
 * transient index ref (dies after the emit site, never retained). Lower-count
 * primitives (series paths, rects, lines, text) keep object commands.
 *
 * P2 records the FINAL geometry only (animation is P4). The recorded data is the
 * substrate later phases re-query without recomputing geometry: hit-testing
 * (P3), state restyle (P3), animation (P4).
 *
 * @module renderers/canvas/CanvasGraphics
 */

/**
 * Object-command style attribute keys → flat field names (path/rect/etc.).
 * @type {Record<string, string>}
 */
const STYLE_KEYS = {
  fill: 'fill',
  stroke: 'stroke',
  'stroke-width': 'strokeWidth',
  'stroke-dasharray': 'strokeDash',
  'stroke-linecap': 'lineCap',
  'fill-opacity': 'fillOpacity',
  'stroke-opacity': 'strokeOpacity',
  'fill-rule': 'fillRule',
}

/** Sentinel that never `===` a real style value, so the cache misses first use. */
const NEVER = Symbol('never')

/**
 * The plot clip a `clip-path` value names, as the canvas paints it: one of
 * the three Grid.createGridMask defines (Grid.maskRects), or null for no
 * clip. Undefined for any other clip, such as a line's forecast masks, which
 * the canvas does not paint through, so the mark keeps the clip it had.
 * @param {any} value
 * @returns {'grid'|'bar'|'marker'|null|undefined}
 */
function plotClip(value) {
  if (value == null || value === 'none') return null
  const m = /^url\(#gridRect(Bar|Marker)?Mask/.exec(String(value))
  if (!m) return undefined
  return m[1] === 'Bar' ? 'bar' : m[1] === 'Marker' ? 'marker' : 'grid'
}

/**
 * Marker shape → small int id (keeps the columnar shape array unboxed).
 * @type {Record<string, number>}
 */
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
  line: 8,
}
const SHAPE_NAME = [
  'circle',
  'square',
  'triangle',
  'diamond',
  'star',
  'sparkle',
  'cross',
  'plus',
  'line',
]

/**
 * The box a path's `d` spans, in the space it was written in (plot px for a
 * recorded mark): the extent of its end and control points. A curve never
 * leaves the hull of its control points, and the marks recorded here keep
 * their handles on the box anyway (a bar's rounded corner bends around the
 * corner it replaces, a violin's monotone spline stays between its nodes),
 * so this is the box the SVG path measures to. An arc counts its end points.
 * Null when the path draws nothing.
 * @param {string} d
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
export function pathBox(d) {
  const tokens =
    typeof d === 'string'
      ? d.match(/[a-df-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi)
      : null
  if (!tokens) return null
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  // the current point, and where the subpath started (Z returns there)
  let px = 0
  let py = 0
  let sx = 0
  let sy = 0
  let cmd = ''
  let k = 0
  const num = () => Number(tokens[k++])
  /** @param {number} x @param {number} y */
  const take = (x, y) => {
    if (!isFinite(x) || !isFinite(y)) return
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x)
    bottom = Math.max(bottom, y)
  }
  /** @param {number} pairs  the last one is the new current point */
  const points = (pairs) => {
    const rel = cmd === cmd.toLowerCase()
    let x = px
    let y = py
    for (let p = 0; p < pairs; p++) {
      x = num() + (rel ? px : 0)
      y = num() + (rel ? py : 0)
      take(x, y)
    }
    px = x
    py = y
  }
  while (k < tokens.length) {
    if (/^[a-z]$/i.test(tokens[k])) {
      cmd = tokens[k++]
      if (cmd === 'Z' || cmd === 'z') {
        px = sx
        py = sy
      }
      continue
    }
    const rel = cmd === cmd.toLowerCase()
    switch (cmd.toUpperCase()) {
      case 'M':
        points(1)
        sx = px
        sy = py
        // further pairs after a move are lines
        cmd = rel ? 'l' : 'L'
        break
      case 'L':
      case 'T':
        points(1)
        break
      case 'H':
        px = num() + (rel ? px : 0)
        take(px, py)
        break
      case 'V':
        py = num() + (rel ? py : 0)
        take(px, py)
        break
      case 'S':
      case 'Q':
        points(2)
        break
      case 'C':
        points(3)
        break
      case 'A':
        k += 5
        points(1)
        break
      default:
        // numbers before any command: nothing to place them by
        k++
    }
  }
  return isFinite(left)
    ? { x: left, y: top, width: right - left, height: bottom - top }
    : null
}

/**
 * A recorded path's box (see pathBox), worked out once per `d`.
 * @param {any} cmd
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
export function markBox(cmd) {
  if (cmd.boxOf !== cmd.d) {
    cmd.box = pathBox(cmd.d)
    cmd.boxOf = cmd.d
  }
  return cmd.box
}

/**
 * A chainable no-op animation runner so `el.animate().attr().after()` chains on
 * a recorded mark don't throw. P2 paints the final state, so animation is inert.
 */
const NOOP_RUNNER = {
  /** @returns {any} */
  attr() {
    return NOOP_RUNNER
  },
  plot() {
    return NOOP_RUNNER
  },
  during() {
    return NOOP_RUNNER
  },
  after(/** @type {any} */ fn) {
    if (typeof fn === 'function') fn()
    return NOOP_RUNNER
  },
  animate() {
    return NOOP_RUNNER
  },
  delay() {
    return NOOP_RUNNER
  },
  loop() {
    return NOOP_RUNNER
  },
  finish() {
    return NOOP_RUNNER
  },
  stop() {
    return NOOP_RUNNER
  },
}

/**
 * A single shared no-op node for columnar marker refs. Markers are write-only in
 * the emit path (fill flows through `attr`; identity/style class/selection are
 * P3, animation is P4), so a shared stub avoids a per-point node allocation.
 */
const SHARED_MARKER_NODE = {
  nodeName: 'path',
  style: {},
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  setAttribute() {},
  getAttribute: () => null,
  removeAttribute() {},
  hasAttribute: () => false,
  addEventListener() {},
  removeEventListener() {},
  appendChild() {},
  getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 }),
}

/**
 * A single shared no-op group. Series draw() creates wrap groups per point that
 * carry no paint state in canvas mode, so they all share this: zero per-point
 * group allocation (the difference between a GC blow-up and a fast render).
 */
const SHARED_GROUP = {
  __isCanvasMark: true,
  node: {
    nodeName: 'g',
    instance: null,
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {},
    getAttribute: () => null,
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    appendChild() {},
    getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  },
  /** @returns {any} */
  attr() {
    return SHARED_GROUP
  },
  add() {
    return SHARED_GROUP
  },
  addTo() {
    return SHARED_GROUP
  },
  remove() {
    return SHARED_GROUP
  },
  clear() {
    return SHARED_GROUP
  },
  css() {
    return SHARED_GROUP
  },
  hide() {
    return SHARED_GROUP
  },
  show() {
    return SHARED_GROUP
  },
  removeClass() {
    return SHARED_GROUP
  },
  animate() {
    return NOOP_RUNNER
  },
}

/**
 * Transient handle for a columnar marker. Holds only (graphics, index); the only
 * paint-relevant mutation the emit sites make is `attr('fill', ...)` (scatter
 * per-point fill), and the only identity one is `attr('rel', ...)`, the data
 * point a hit test reports. Everything else no-ops. Not retained past the
 * emit site.
 */
class CanvasMarkerRef {
  /**
   * @param {CanvasGraphics} g
   * @param {number} i
   */
  constructor(g, i) {
    this.__isCanvasMark = true
    this._g = g
    this._i = i
  }
  get node() {
    return SHARED_MARKER_NODE
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a, v) {
    if (typeof a === 'string') {
      if (a === 'fill' && v !== undefined) this._g._setMarkerFill(this._i, v)
      else if (a === 'rel' && v !== undefined) this._g._mdi[this._i] = v
      return v === undefined ? null : this
    }
    if (a && a.fill !== undefined) this._g._setMarkerFill(this._i, a.fill)
    if (a && a.rel !== undefined) this._g._mdi[this._i] = a.rel
    return this
  }
  /** @param {any} _c */
  add(_c) {
    return this
  }
  /** @param {any} _p */
  addTo(_p) {
    return this
  }
  remove() {
    return this
  }
  /** @param {any} _s */
  css(_s) {
    return this
  }
  /** @param {any} _v */
  fill(_v) {
    if (_v !== undefined) this._g._setMarkerFill(this._i, _v)
    return this
  }
  /** @param {any} _v */
  stroke(_v) {
    return this
  }
  hide() {
    return this
  }
  show() {
    return this
  }
  /** @param {string} _c */
  removeClass(_c) {
    return this
  }
  animate() {
    return NOOP_RUNNER
  }
}

/**
 * Shared no-op handle for a columnar rect cell. Cells are write-only in the
 * emit path (all geometry + style is passed to drawRectCell up front; identity
 * lives in the columns), so every cell returns this one stub: zero per-cell
 * allocation. Chainable so any stray `.attr()/.add()` on a cell can't throw.
 */
const SHARED_RECT_REF = {
  __isCanvasMark: true,
  node: SHARED_MARKER_NODE,
  /** @returns {any} */
  attr() {
    return SHARED_RECT_REF
  },
  add() {
    return SHARED_RECT_REF
  },
  addTo() {
    return SHARED_RECT_REF
  },
  remove() {
    return SHARED_RECT_REF
  },
  /** @returns {any} */
  css() {
    return SHARED_RECT_REF
  },
  animate() {
    return NOOP_RUNNER
  },
}

/**
 * Object-command handle for lower-count primitives (series paths, rects, lines,
 * text). Style-relevant `attr()` / `node.setAttribute()` writes flow into the
 * bound command so late edits (forecast dashArray, fill-rule) paint. It
 * deliberately omits `filterWith`/`unfilter`: `Filters` guards on their
 * presence, so filter/dropShadow effects safely no-op in canvas mode.
 */
class CanvasMark {
  /** @param {any} cmd */
  constructor(cmd) {
    this.__isCanvasMark = true
    this._cmd = cmd
    const self = this
    this.node = {
      nodeName: cmd ? cmd.tag : 'g',
      instance: this,
      style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      /** @param {string} k @param {any} v */
      setAttribute(k, v) {
        self._applyAttr(k, v)
      },
      getAttribute: () => null,
      removeAttribute() {},
      hasAttribute: () => false,
      addEventListener() {},
      removeEventListener() {},
      appendChild() {},
      getBBox: () => self.bbox(),
    }
  }
  /**
   * @param {string} k
   * @param {any} v
   */
  _applyAttr(k, v) {
    const cmd = this._cmd
    if (!cmd) return
    if (k === 'clip-path') {
      const clip = plotClip(v)
      if (clip !== undefined) cmd.clip = clip
      return
    }
    const sk = STYLE_KEYS[k]
    if (sk !== undefined) cmd[sk] = v
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a, v) {
    if (typeof a === 'string') {
      if (v === undefined) return null
      this._applyAttr(a, v)
      return this
    }
    for (const k in a) {
      if (a[k] !== undefined) this._applyAttr(k, a[k])
    }
    return this
  }
  /** @param {any} _c */
  add(_c) {
    return this
  }
  /** @param {any} _p */
  addTo(_p) {
    return this
  }
  remove() {
    return this
  }
  clear() {
    return this
  }
  /** @param {any} _s */
  css(_s) {
    return this
  }
  /** @param {any} v */
  fill(v) {
    if (typeof v === 'object') return this.attr(v)
    return this.attr('fill', v)
  }
  /** @param {any} v */
  stroke(v) {
    if (typeof v === 'object') {
      if (v.color !== undefined) this.attr('stroke', v.color)
      if (v.width !== undefined) this.attr('stroke-width', v.width)
      return this
    }
    return this.attr('stroke', v)
  }
  /** @param {string} d */
  plot(d) {
    if (typeof d === 'string' && this._cmd && this._cmd.tag === 'path') {
      this._cmd.d = d
    }
    return this
  }
  hide() {
    return this
  }
  show() {
    return this
  }
  /** @param {string} _c */
  removeClass(_c) {
    return this
  }
  /**
   * The box a recorded path spans, as an SVG path's getBBox() measures it;
   * an empty box for anything else.
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  bbox() {
    const cmd = this._cmd
    const box = cmd && cmd.tag === 'path' ? markBox(cmd) : null
    return box ? { ...box } : { x: 0, y: 0, width: 0, height: 0 }
  }
  animate() {
    return NOOP_RUNNER
  }
}

export default class CanvasGraphics {
  /** @param {any} w */
  constructor(w) {
    this.w = w
    this._g = new Graphics(w) // getMarkerPath is a pure geometry helper
    // Initialized here (not only in reset()) so their types are non-nullable.
    /** @type {any[]} object commands: paths / rects / lines / text */
    this._list = []
    // Columnar marker store: PRE-SIZED typed arrays, index-assigned (never
    // .push()). Growing a retained array per point while the render churns
    // transient garbage triggers a V8 scavenge blow-up (measured: 50k pushes ~
    // 4.8s); a fixed typed array whose contents aren't GC-traced avoids it
    // entirely (~ms). Capacity is estimated from the series lengths per render.
    /** @type {Float64Array} */
    this._mx = new Float64Array(16)
    /** @type {Float64Array} */
    this._my = new Float64Array(16)
    /** @type {Float64Array} */
    this._msize = new Float64Array(16)
    /** @type {Int16Array} */
    this._mshape = new Int16Array(16)
    /** @type {Int32Array} */
    this._mstyle = new Int32Array(16)
    /** @type {Int32Array} series (realIndex) per marker, for per-series restyle */
    this._msi = new Int32Array(16)
    /** @type {Int32Array} dataPointIndex per marker (hit-test), -1 if none */
    this._mdi = new Int32Array(16)
    this._mn = 0
    this._mcap = 16
    // Columnar rect-cell store (heatmap cells; dense same-shape rects). Same
    // rationale as markers: a retained object per cell trips a V8 scavenge
    // blow-up at 50k+, so cells are unboxed parallel arrays + the shared style
    // palette. Corner radius is uniform per chart, so it is a scalar not a column.
    /** @type {Float64Array} */
    this._crx = new Float64Array(16)
    /** @type {Float64Array} */
    this._cry = new Float64Array(16)
    /** @type {Float64Array} */
    this._crw = new Float64Array(16)
    /** @type {Float64Array} */
    this._crh = new Float64Array(16)
    /** @type {Int32Array} */
    this._crstyle = new Int32Array(16)
    /** @type {Int32Array} series realIndex per cell (restyle / hit-test) */
    this._crsi = new Int32Array(16)
    /** @type {Int32Array} dataPointIndex per cell (hit-test) */
    this._crdi = new Int32Array(16)
    this._crn = 0
    this._crcap = 16
    this._cellRadius = 0
    /** @type {any[]} */
    this._styles = []
    /** @type {Map<string, number>} */
    this._styleMap = new Map()
    // Last-style + last-fill-override caches (keep interning out of the marker
    // hot loop). Declared here with types so TS treats them as non-nullable;
    // _resetStyleCache() reassigns them per render.
    /** @type {any} */
    this._lf = NEVER
    /** @type {any} */
    this._ls = NEVER
    /** @type {any} */
    this._lsw = NEVER
    /** @type {any} */
    this._ld = NEVER
    /** @type {any} */
    this._lfo = NEVER
    /** @type {any} */
    this._lso = NEVER
    /** @type {number} */
    this._lid = -1
    /** @type {any} */
    this._lofFill = NEVER
    /** @type {number} */
    this._lofBase = -1
    /** @type {number} */
    this._lofId = -1
    // rect-cell last-style cache (keeps the intern Map/string work off the
    // per-cell hot loop when a run of cells shares one style)
    /** @type {any} */
    this._rlf = NEVER
    /** @type {any} */
    this._rls = NEVER
    /** @type {any} */
    this._rlsw = NEVER
    /** @type {any} */
    this._rlfo = NEVER
    /** @type {any} */
    this._rlso = NEVER
    /** @type {number} */
    this._rlid = -1
  }

  _resetStyleCache() {
    this._lf = NEVER // fill
    this._ls = NEVER // stroke
    this._lsw = NEVER
    this._ld = NEVER
    this._lfo = NEVER
    this._lso = NEVER
    this._lid = -1
    this._lofFill = NEVER // last fill-override (scatter per-point fill)
    this._lofBase = -1
    this._lofId = -1
    this._rlf = NEVER // rect-cell last style
    this._rls = NEVER
    this._rlsw = NEVER
    this._rlfo = NEVER
    this._rlso = NEVER
    this._rlid = -1
  }

  /** Start a fresh scene (columnar marker store + object-command list). */
  reset() {
    this._list = []
    this._mn = 0
    this._styles = []
    this._styleMap = new Map()
    this._resetStyleCache()
    // Size the marker columns to the upper bound of points this render can emit.
    const series = this.w.config.series || []
    let cap = 16
    for (let i = 0; i < series.length; i++) {
      const d = series[i] && series[i].data
      if (Array.isArray(d)) cap += d.length
    }
    cap = Math.ceil(cap * 1.15) + 16
    if (cap > this._mcap) this._allocMarkers(cap)
    // Rect cells share the same upper bound (one cell per data point).
    this._crn = 0
    this._cellRadius = 0
    if (cap > this._crcap) this._allocRects(cap)
  }

  /** @param {number} cap */
  _allocRects(cap) {
    this._crcap = cap
    this._crx = new Float64Array(cap)
    this._cry = new Float64Array(cap)
    this._crw = new Float64Array(cap)
    this._crh = new Float64Array(cap)
    this._crstyle = new Int32Array(cap)
    this._crsi = new Int32Array(cap)
    this._crdi = new Int32Array(cap)
  }

  /** Grow the rect columns (rare: capacity estimate was low). */
  _growRects() {
    const cap = this._crcap * 2
    const nx = new Float64Array(cap)
    nx.set(this._crx)
    this._crx = nx
    const ny = new Float64Array(cap)
    ny.set(this._cry)
    this._cry = ny
    const nw = new Float64Array(cap)
    nw.set(this._crw)
    this._crw = nw
    const nh = new Float64Array(cap)
    nh.set(this._crh)
    this._crh = nh
    const nst = new Int32Array(cap)
    nst.set(this._crstyle)
    this._crstyle = nst
    const nsi = new Int32Array(cap)
    nsi.set(this._crsi)
    this._crsi = nsi
    const ndi = new Int32Array(cap)
    ndi.set(this._crdi)
    this._crdi = ndi
    this._crcap = cap
  }

  /** @param {number} cap */
  _allocMarkers(cap) {
    this._mcap = cap
    this._mx = new Float64Array(cap)
    this._my = new Float64Array(cap)
    this._msize = new Float64Array(cap)
    this._mshape = new Int16Array(cap)
    this._mstyle = new Int32Array(cap)
    this._msi = new Int32Array(cap)
    this._mdi = new Int32Array(cap)
  }

  /** Grow the marker columns (rare: capacity estimate was low). */
  _growMarkers() {
    const cap = this._mcap * 2
    const nx = new Float64Array(cap)
    nx.set(this._mx)
    this._mx = nx
    const ny = new Float64Array(cap)
    ny.set(this._my)
    this._my = ny
    const ns = new Float64Array(cap)
    ns.set(this._msize)
    this._msize = ns
    const nsh = new Int16Array(cap)
    nsh.set(this._mshape)
    this._mshape = nsh
    const nst = new Int32Array(cap)
    nst.set(this._mstyle)
    this._mstyle = nst
    const nsi = new Int32Array(cap)
    nsi.set(this._msi)
    this._msi = nsi
    const ndi = new Int32Array(cap)
    ndi.set(this._mdi)
    this._mdi = ndi
    this._mcap = cap
  }

  displayList() {
    return this._list
  }
  markerCount() {
    return this._mn
  }

  /**
   * Intern a marker style; returns its palette id. Keeps the per-point columns
   * numeric (no retained per-point object).
   * @param {any} fill @param {any} stroke @param {any} sw @param {any} dash
   * @param {any} fo @param {any} so
   * @returns {number}
   */
  _internStyle(fill, stroke, sw, dash, fo, so) {
    const key = `${fill}|${stroke}|${sw}|${dash}|${fo}|${so}`
    const cached = this._styleMap.get(key)
    if (cached !== undefined) return cached
    const id = this._styles.length
    this._styles.push({
      fill,
      stroke,
      strokeWidth: sw,
      strokeDash: dash,
      fillOpacity: fo,
      strokeOpacity: so,
    })
    this._styleMap.set(key, id)
    return id
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
    const base = this._mstyle[i]
    if (fill === this._lofFill && base === this._lofBase) {
      this._mstyle[i] = this._lofId
      return
    }
    const s = this._styles[base]
    if (!s || s.fill === fill) {
      this._lofFill = fill
      this._lofBase = base
      this._lofId = base
      return
    }
    const id = this._internStyle(
      fill,
      s.stroke,
      s.strokeWidth,
      s.strokeDash,
      s.fillOpacity,
      s.strokeOpacity,
    )
    this._mstyle[i] = id
    this._lofFill = fill
    this._lofBase = base
    this._lofId = id
  }

  /** @param {number} i @returns {any} the style object for a marker index */
  markerStyle(i) {
    return this._styles[this._mstyle[i]]
  }
  /** @param {number} i @returns {number} series (realIndex) of a marker, -1 if none */
  markerSeries(i) {
    return this._msi[i]
  }
  /** @param {number} id @returns {string} */
  shapeName(id) {
    return SHAPE_NAME[id] || 'circle'
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
  drawRectCell(x, y, w, h, opts = {}) {
    const styleId = this._rectStyleId(opts)
    if (this._crn >= this._crcap) this._growRects()
    const i = this._crn++
    this._crx[i] = x || 0
    this._cry[i] = y || 0
    this._crw[i] = w > 0 ? w : 0
    this._crh[i] = h > 0 ? h : 0
    this._crstyle[i] = styleId
    this._crsi[i] = opts.seriesIndex == null ? -1 : opts.seriesIndex
    this._crdi[i] = opts.dataPointIndex == null ? -1 : opts.dataPointIndex
    // Corner radius is uniform across a heatmap; record the latest non-zero one.
    if (opts.radius) this._cellRadius = opts.radius
    return SHARED_RECT_REF
  }

  /**
   * Resolve (and dedupe) a rect-cell style → shared-palette id. A last-style
   * cache keeps the Map/string work off the path for runs of same-style cells.
   * @param {any} opts
   * @returns {number}
   */
  _rectStyleId(opts) {
    const fill = opts.fill
    const stroke = opts.stroke
    const sw = opts.strokeWidth
    const fo = opts.fillOpacity
    const so = opts.strokeOpacity
    if (
      fill === this._rlf &&
      stroke === this._rls &&
      sw === this._rlsw &&
      fo === this._rlfo &&
      so === this._rlso
    ) {
      return this._rlid
    }
    const id = this._internStyle(fill, stroke, sw, 0, fo, so)
    this._rlf = fill
    this._rls = stroke
    this._rlsw = sw
    this._rlfo = fo
    this._rlso = so
    this._rlid = id
    return id
  }

  /** @returns {number} number of recorded rect cells */
  rectCount() {
    return this._crn
  }
  /** @param {number} i @returns {any} the style object for a rect cell */
  rectStyle(i) {
    return this._styles[this._crstyle[i]]
  }
  /** @param {number} i @returns {number} series (realIndex) of a cell, -1 if none */
  rectSeries(i) {
    return this._crsi[i]
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
      fill: undefined,
      stroke: undefined,
      strokeWidth: undefined,
      strokeDash: undefined,
      lineCap: undefined,
      fillOpacity: undefined,
      strokeOpacity: undefined,
      fillRule: undefined,
      // The plot clip it is painted through ('grid' | 'bar' | 'marker'),
      // null for none: whatever `clip-path` the SVG mark would carry.
      clip: null,
    }
    this._list.push(cmd)
    return cmd
  }

  // ── organizational (groups don't paint or record) ──
  // Series draw() creates a wrap group PER POINT (scatter.draw / plotChartMarkers
  // run per point), so allocating a handle per group is ~50k heavy allocations
  // at scale: enough transient churn to tip V8 into a GC blow-up. Groups carry
  // no paint state in canvas mode (attr/add are no-ops), so every group shares
  // one singleton: zero per-point allocation.
  /** @param {any} _attrs */
  group(_attrs) {
    return SHARED_GROUP
  }

  // ── per-point marker (line/area markers, scatter, bubble): COLUMNAR ──
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x, y, opts = {}) {
    // Style resolution (string key + Map intern) lives in a SEPARATE method from
    // the typed-array stores below. Co-locating string/Map work with typed-array
    // element stores in one hot function tips V8 into a pathological slow path
    // (measured ~80× at 50k points); split, each stays optimized. `styleId`
    // indexes the deduped style palette.
    const styleId = this._markerStyleId(opts)
    if (this._mn >= this._mcap) this._growMarkers()
    const i = this._mn++
    this._mx[i] = x || 0
    this._my[i] = typeof y === 'number' ? y : NaN
    this._msize[i] = opts.pSize || 0
    this._mshape[i] = SHAPE_ID[opts.shape || 'circle'] ?? 0
    this._mstyle[i] = styleId
    // Series identity (realIndex) so per-series restyle (hover/legend dim) can
    // repaint markers without recomputing geometry. Both marker emitters pass
    // realIndex as opts.seriesIndex (Markers.getMarkerConfig, Scatter.drawPoint).
    this._msi[i] = opts.seriesIndex == null ? -1 : opts.seriesIndex
    // The data point is not in the marker config; both emitters name it
    // through `attr('rel', ...)` right after, which CanvasMarkerRef records.
    this._mdi[i] = -1
    return new CanvasMarkerRef(this, i)
  }

  /**
   * Resolve (and dedupe) a marker style → palette id. A last-style cache keeps
   * the Map/string work off the path when consecutive markers share a style
   * (the common case), so intern runs once per style run.
   * @param {any} opts
   * @returns {number}
   */
  _markerStyleId(opts) {
    const shape = opts.shape || 'circle'
    const strokeTinted = shape === 'line' || shape === 'plus' || shape === 'cross'
    const fill = strokeTinted ? 'none' : opts.pointFillColor
    const stroke = strokeTinted ? opts.pointFillColor : opts.pointStrokeColor
    const sw = opts.pointStrokeWidth
    const dash = opts.pointStrokeDashArray
    const fo = opts.pointFillOpacity
    const so = strokeTinted ? opts.pointFillOpacity : opts.pointStrokeOpacity
    if (
      fill === this._lf &&
      stroke === this._ls &&
      sw === this._lsw &&
      dash === this._ld &&
      fo === this._lfo &&
      so === this._lso
    ) {
      return this._lid
    }
    const id = this._internStyle(fill, stroke, sw, dash, fo, so)
    this._lf = fill
    this._ls = stroke
    this._lsw = sw
    this._ld = dash
    this._lfo = fo
    this._lso = so
    this._lid = id
    return id
  }

  // ── series body path (line/area/bar): object command ──
  /** @param {any} opts */
  renderPaths(opts) {
    const cmd = this._cmd('path', opts.realIndex)
    cmd.d = opts.pathTo
    // Numeric fast-path coords (plain straight line/area): painted with a
    // direct moveTo/lineTo loop, no d-string Path2D parse. closeY (area)
    // drops the fill down to the baseline and closes the polygon.
    if (opts.pathToNumeric) {
      cmd.nxs = opts.pathToNumeric.xs
      cmd.nys = opts.pathToNumeric.ys
      cmd.ncloseY = opts.pathToNumeric.closeY
    }
    cmd.stroke = opts.stroke
    cmd.strokeWidth = opts.strokeWidth
    cmd.fill = opts.fill
    cmd.lineCap = opts.strokeLinecap
    cmd.si = opts.realIndex
    // Data point identity. Only a mark that stands for one point (a bar-like:
    // Bar.renderSeries) passes `j`; a line or area path stands for the whole
    // series and records none. hitTest resolves a hovered mark by it.
    if (typeof opts.j === 'number') cmd.dj = opts.j
    // The clip Graphics.renderPaths gives the SVG path. A caller that sets
    // its own afterwards (Bar.renderSeries) replaces it, as on SVG.
    if (opts.shouldClipToGrid !== false) {
      const gl = this.w.globals
      cmd.clip =
        (opts.chartType === 'bar' && !gl.isBarHorizontal) || gl.comboCharts
          ? 'bar'
          : 'grid'
    }
    // Mirror the SVG renderPaths side effect so downstream "wait for animation"
    // logic doesn't stall (canvas P2 paints the final frame directly).
    this.w.globals.animationEnded = true
    return new CanvasMark(cmd)
  }

  /** @param {any} opts */
  drawPath(opts) {
    const cmd = this._cmd('path', 0)
    cmd.d = opts.d
    cmd.stroke = opts.stroke
    cmd.strokeWidth = opts.strokeWidth
    cmd.fill = opts.fill
    cmd.fillOpacity = opts.fillOpacity
    cmd.strokeOpacity = opts.strokeOpacity
    cmd.lineCap = opts.strokeLinecap
    cmd.strokeDash = opts.strokeDashArray
    return new CanvasMark(cmd)
  }

  // ── remaining primitives (contract completeness / Marks #11 forward-compat) ──
  /**
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {string} lineColor @param {any} dashArray @param {number} strokeWidth
   */
  drawLine(x1, y1, x2, y2, lineColor = '#a8a8a8', dashArray = 0, strokeWidth = 1) {
    const cmd = this._cmd('line', 0)
    cmd.lx1 = x1
    cmd.ly1 = y1
    cmd.lx2 = x2
    cmd.ly2 = y2
    cmd.stroke = lineColor
    cmd.strokeDash = dashArray
    cmd.strokeWidth = strokeWidth
    return new CanvasMark(cmd)
  }

  /**
   * Mirrors Graphics.drawRect's full signature (including stroke), so callers
   * that stroke rects (Marks api.rect, chart code) paint the same on canvas.
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {number} radius @param {string} color @param {number} opacity
   * @param {number|null} [strokeWidth] @param {string|null} [strokeColor]
   * @param {any} [strokeDashArray]
   */
  drawRect(
    x1 = 0,
    y1 = 0,
    x2 = 0,
    y2 = 0,
    radius = 0,
    color = '#fefefe',
    opacity = 1,
    strokeWidth = null,
    strokeColor = null,
    strokeDashArray = 0,
  ) {
    const cmd = this._cmd('rect', 0)
    cmd.x1 = x1
    cmd.y1 = y1
    cmd.rw = x2 > 0 ? x2 : 0
    cmd.rh = y2 > 0 ? y2 : 0
    cmd.radius = radius
    cmd.fill = color
    cmd.fillOpacity = opacity
    if (strokeColor != null) {
      cmd.stroke = strokeColor
      cmd.strokeWidth = strokeWidth == null ? 1 : strokeWidth
      cmd.strokeDash = strokeDashArray
    }
    return new CanvasMark(cmd)
  }

  /**
   * @param {number} radius
   * @param {any} attrs
   */
  drawCircle(radius, attrs = null) {
    const cmd = this._cmd('circle', 0)
    cmd.r = radius < 0 ? 0 : radius
    if (attrs) {
      cmd.cx = attrs.cx
      cmd.cy = attrs.cy
      if (attrs.fill !== undefined) cmd.fill = attrs.fill
      if (attrs.stroke !== undefined) cmd.stroke = attrs.stroke
    }
    return new CanvasMark(cmd)
  }

  /** @param {any} opts */
  drawText(opts) {
    const cmd = this._cmd('text', 0)
    cmd.text = Array.isArray(opts.text) ? opts.text.join(' ') : opts.text
    cmd.tx = opts.x
    cmd.ty = opts.y
    cmd.textAnchor = opts.textAnchor || 'start'
    cmd.fontSize = opts.fontSize
    cmd.fontFamily = opts.fontFamily
    cmd.fill = opts.foreColor
    return new CanvasMark(cmd)
  }

  /**
   * Resolve a marker's SVG path `d` (non-circle shapes) lazily at paint time.
   * @param {number} x @param {number} y @param {number} shapeId @param {number} size
   * @returns {string}
   */
  markerPath(x, y, shapeId, size) {
    return this._g.getMarkerPath(x, y, SHAPE_NAME[shapeId] || 'circle', size)
  }
}

export { CanvasMark, CanvasMarkerRef }
