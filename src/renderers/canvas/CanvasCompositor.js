// @ts-check
import SVGElement from '../../svg/SVGElement'
import { SVGNS } from '../../svg/math'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'

/**
 * Strata (#2) P2: CanvasCompositor: owns the `<foreignObject><canvas>` series
 * layer and paints a display list into it.
 *
 * Layer placement (spec §4, Option A): the foreignObject lives INSIDE
 * `elGraphical`, so it inherits the plot-position transform
 * (`translate(translateX, translateY)`, `Core.shiftGraphPosition`) plus the
 * Paper offset. Series `d`-strings are elGraphical-local (0-based at the plot
 * origin), so the canvas only needs DPR scaling: no extra translate. A small
 * margin around the plot rect keeps edge markers from being clipped.
 *
 * @module renderers/canvas/CanvasCompositor
 */

const TWO_PI = Math.PI * 2

/** Cap the backing store at 2× to bound memory on hi-DPI at large sizes (§17.5). */
const DPR_CAP = 2

export default class CanvasCompositor {
  /** @param {any} w */
  constructor(w) {
    this.w = w
    /** @type {any} */
    this._host = null
    /** @type {any} */
    this._canvas = null
    /** @type {any} */
    this._c2d = null
    this._margin = 0
    this._dpr = 1
    // Per-series dim spec for restyle (hover / legend). null = no dimming.
    /** @type {{active:number, opacity:number}|null} */
    this._dim = null
    // Current per-mark opacity multiplier (1 unless dimming an inactive series).
    this._alpha = 1
    // Reusable unit-geometry Path2D per (shape, size), built at the origin and
    // painted via setTransform: non-circle markers need no per-marker d-string
    // build and no per-marker Path2D allocation (measured ~2x faster at 50k).
    /** @type {Map<string, any>} */
    this._unitPaths = new Map()
    // Marker style-batch counter for the last paint(): a batch is one
    // fill/stroke state application covering a run of same-style markers. A
    // single-series scatter with uniform markers must produce exactly 1.
    this._markerBatches = 0
  }

  /** Marker style-batches applied during the last paint() (dev/test hook). */
  markerBatchCount() {
    return this._markerBatches
  }

  /**
   * Opacity multiplier for a series index under the active dim spec: 1 for the
   * highlighted series (or when not dimming, or for unidentified marks), else
   * the inactive opacity.
   * @param {number} si
   * @returns {number}
   */
  _seriesAlpha(si) {
    const d = this._dim
    if (!d || d.active == null || d.active < 0 || si == null || si < 0) return 1
    return si === d.active ? 1 : d.opacity == null ? 0.2 : d.opacity
  }

  _plotDims() {
    const gw = Math.max(0, Math.ceil(this.w.layout.gridWidth || 0))
    const gh = Math.max(0, Math.ceil(this.w.layout.gridHeight || 0))
    const largest = this.w.globals.markers?.largestSize || 0
    const margin = Math.ceil(largest + 8)
    return { gw, gh, margin }
  }

  /**
   * Create (or recreate) the foreignObject + canvas sized to the plot rect and
   * return the SVGElement host that `plotChartType` inserts into the tree.
   * @returns {any}
   */
  createHost() {
    const win = BrowserAPIs.getWindow()
    this._dpr = Math.min(DPR_CAP, (win && win.devicePixelRatio) || 1)
    const { gw, gh, margin } = this._plotDims()
    this._margin = margin

    const w = gw + margin * 2
    const h = gh + margin * 2

    const fo = BrowserAPIs.createElementNS(SVGNS, 'foreignObject')
    fo.setAttribute('x', String(-margin))
    fo.setAttribute('y', String(-margin))
    fo.setAttribute('width', String(w))
    fo.setAttribute('height', String(h))
    fo.setAttribute('class', 'apexcharts-canvas-series')
    // Never intercept pointer events: the SVG chrome + hit-test bridge (P3)
    // own interaction; the canvas is paint-only.
    fo.style.overflow = 'visible'

    const canvas = /** @type {any} */ (BrowserAPIs.createElement('canvas'))
    canvas.setAttribute('class', 'apexcharts-series-canvas')
    canvas.width = Math.max(1, Math.round(w * this._dpr))
    canvas.height = Math.max(1, Math.round(h * this._dpr))
    canvas.style.width = w + 'px'
    canvas.style.height = h + 'px'
    canvas.style.pointerEvents = 'none'
    fo.appendChild(canvas)

    this._canvas = canvas
    this._c2d = canvas.getContext('2d')
    this._host = new SVGElement(fo)
    return this._host
  }

  getHost() {
    return this._host
  }

  clear() {
    if (!this._c2d || !this._canvas) return
    this._c2d.setTransform(1, 0, 0, 1, 0, 0)
    this._c2d.clearRect(0, 0, this._canvas.width, this._canvas.height)
  }

  /**
   * Re-check devicePixelRatio before painting: a restyle() repaint after the
   * window moved between monitors would otherwise keep the stale backing-store
   * scale (blurry or over-sized) until the next full render rebuilds the host.
   * The canvas CSS size is unchanged; only the backing store is resized.
   */
  _syncDpr() {
    if (!this._canvas) return
    const win = BrowserAPIs.getWindow()
    const dpr = Math.min(DPR_CAP, (win && win.devicePixelRatio) || 1)
    if (dpr === this._dpr) return
    this._dpr = dpr
    const wCss = parseFloat(this._canvas.style.width) || 0
    const hCss = parseFloat(this._canvas.style.height) || 0
    this._canvas.width = Math.max(1, Math.round(wCss * dpr))
    this._canvas.height = Math.max(1, Math.round(hCss * dpr))
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
    const ctx = this._c2d
    if (!ctx) return

    this._dim = dim || null
    this._syncDpr()
    this.clear()
    const dpr = this._dpr
    const m = this._margin
    // Grid-local (0,0) → device (m*dpr) so it lands at the foreignObject's
    // plot origin (which is inset by the margin).
    ctx.setTransform(dpr, 0, 0, dpr, m * dpr, m * dpr)

    // ── object commands (paths / rects / lines / text), z-ordered ──
    if (list.length) {
      const ordered =
        list.length > 1
          ? list
              .map((/** @type {any} */ c, /** @type {number} */ i) => [c, i])
              .sort((/** @type {any} */ a, /** @type {any} */ b) =>
                a[0].z === b[0].z ? a[1] - b[1] : a[0].z - b[0].z,
              )
              .map((/** @type {any} */ pair) => pair[0])
          : list
      for (let i = 0; i < ordered.length; i++) {
        const c = ordered[i]
        this._alpha = this._dim ? this._seriesAlpha(c.si) : 1
        this._paintOne(ctx, c)
      }
    }

    // ── columnar rect cells (heatmap), then columnar markers on top ──
    this._paintRects(ctx, shim)
    this._paintMarkers(ctx, shim)
    this._alpha = 1
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
    const n = shim.rectCount ? shim.rectCount() : 0
    if (!n) return
    const rx = shim._crx
    const ry = shim._cry
    const rw = shim._crw
    const rh = shim._crh
    const rstyle = shim._crstyle
    const radius = shim._cellRadius || 0
    const cx = /** @type {any} */ (ctx)
    const useRound = radius > 0 && typeof cx.roundRect === 'function'
    const dimming = !!this._dim

    // Clip to the plot rect (grid-local 0,0 → gridWidth,gridHeight).
    const gw = Math.max(0, this.w.layout.gridWidth || 0)
    const gh = Math.max(0, this.w.layout.gridHeight || 0)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, gw, gh)
    ctx.clip()

    let i = 0
    while (i < n) {
      const styleId = rstyle[i]
      const style = shim.rectStyle(i)
      if (!style) {
        i++
        continue
      }
      const fill = style.fill
      const doFill =
        fill &&
        fill !== 'none' &&
        !(typeof fill === 'string' && fill.indexOf('url(') === 0)
      const stroke = style.stroke
      const sw = style.strokeWidth == null ? 0 : Number(style.strokeWidth)
      const doStroke =
        stroke &&
        stroke !== 'none' &&
        sw > 0 &&
        !(typeof stroke === 'string' && stroke.indexOf('url(') === 0)
      // One state application for the whole same-style run.
      if (doFill) ctx.fillStyle = fill
      if (doStroke) {
        ctx.strokeStyle = stroke
        ctx.lineWidth = sw
        ctx.setLineDash([])
      }
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity)
      const baseStrokeA =
        style.strokeOpacity == null ? 1 : Number(style.strokeOpacity)

      let j = i
      while (j < n && rstyle[j] === styleId) {
        const w = rw[j]
        const h = rh[j]
        if (w > 0 && h > 0) {
          const f = dimming ? this._seriesAlpha(shim.rectSeries(j)) : 1
          if (useRound) {
            ctx.beginPath()
            cx.roundRect(rx[j], ry[j], w, h, radius)
            if (doFill) {
              ctx.globalAlpha = baseFillA * f
              ctx.fill()
            }
            if (doStroke) {
              ctx.globalAlpha = baseStrokeA * f
              ctx.stroke()
            }
          } else {
            if (doFill) {
              ctx.globalAlpha = baseFillA * f
              ctx.fillRect(rx[j], ry[j], w, h)
            }
            if (doStroke) {
              ctx.globalAlpha = baseStrokeA * f
              ctx.strokeRect(rx[j], ry[j], w, h)
            }
          }
        }
        j++
      }
      i = j
    }
    ctx.globalAlpha = 1
    ctx.restore()
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
    const key = shapeId + '|' + size
    let p = this._unitPaths.get(key)
    if (p === undefined) {
      try {
        p = new Path2D(shim.markerPath(0, 0, shapeId, size))
      } catch (e) {
        p = null // malformed: recorded so we don't retry per marker
      }
      this._unitPaths.set(key, p)
    }
    return p
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
    this._markerBatches = 0
    const n = shim.markerCount()
    if (!n) return
    const mx = shim._mx
    const my = shim._my
    const msize = shim._msize
    const mshape = shim._mshape
    const mstyle = shim._mstyle
    const dimming = !!this._dim
    if (!dimming) this._alpha = 1

    let i = 0
    while (i < n) {
      const styleId = mstyle[i]
      const shapeId = mshape[i]
      const style = shim.markerStyle(i)
      if (!style) {
        i++
        continue
      }

      // One state application for the whole same-style run.
      const doFill = this._applyFill(ctx, style)
      const doStroke = this._applyStroke(ctx, style)
      this._markerBatches++
      // Base opacities for the per-marker dim path (colours stay set above;
      // only globalAlpha varies by series when a dim spec is active).
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity)
      const baseStrokeA =
        style.strokeOpacity == null ? 1 : Number(style.strokeOpacity)

      if (shapeId === 0) {
        // Circle run. Draw each circle with its own beginPath/arc/fill after
        // the single state change. (Accumulating all circles into one path and
        // filling once is FAR slower: measured ~6300ms vs ~35ms at 50k, since
        // the fill must scan-convert the entire 50k-subpath path in one shot;
        // per-circle fills after one state change are the fast pattern.)
        let j = i
        while (j < n && mshape[j] === 0 && mstyle[j] === styleId) {
          const r = msize[j] || 0
          const y = my[j]
          if (r > 0 && y === y) {
            // y===y rejects NaN (invalid point)
            ctx.beginPath()
            ctx.arc(mx[j], y, r, 0, TWO_PI)
            if (dimming) {
              const f = this._seriesAlpha(shim.markerSeries(j))
              if (doFill) {
                ctx.globalAlpha = baseFillA * f
                ctx.fill()
              }
              if (doStroke) {
                ctx.globalAlpha = baseStrokeA * f
                ctx.stroke()
              }
            } else {
              if (doFill) ctx.fill()
              if (doStroke) ctx.stroke()
            }
          }
          j++
        }
        ctx.globalAlpha = 1
        i = j
      } else {
        // Non-circle run: reuse one unit Path2D per (shape, size), translated
        // to each marker via setTransform. No per-marker d-string build, no
        // per-marker Path2D allocation.
        const dpr = this._dpr
        const m = this._margin
        let j = i
        while (j < n && mshape[j] === shapeId && mstyle[j] === styleId) {
          const y = my[j]
          const size = msize[j]
          if (y === y && size > 0) {
            const p = this._unitPath(shim, shapeId, size)
            if (p) {
              ctx.setTransform(dpr, 0, 0, dpr, (m + mx[j]) * dpr, (m + y) * dpr)
              // fill and stroke opacities are applied per op (matching the
              // previous per-marker _fillStrokePath behavior exactly)
              const f = dimming ? this._seriesAlpha(shim.markerSeries(j)) : 1
              if (doFill) {
                ctx.globalAlpha = baseFillA * f
                ctx.fill(p)
              }
              if (doStroke) {
                ctx.globalAlpha = baseStrokeA * f
                ctx.stroke(p)
              }
            }
          }
          j++
        }
        // restore the grid-local base transform
        ctx.setTransform(dpr, 0, 0, dpr, m * dpr, m * dpr)
        ctx.globalAlpha = 1
        i = j
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
    const xs = cmd.nxs
    const ys = cmd.nys
    const n = xs.length
    if (!n) return
    ctx.beginPath()
    ctx.moveTo(xs[0], ys[0])
    for (let k = 1; k < n; k++) {
      ctx.lineTo(xs[k], ys[k])
    }
    if (cmd.ncloseY != null) {
      ctx.lineTo(xs[n - 1], cmd.ncloseY)
      ctx.lineTo(xs[0], cmd.ncloseY)
      ctx.closePath()
    }
    if (this._applyFill(ctx, cmd)) {
      ctx.fill(cmd.fillRule === 'evenodd' ? 'evenodd' : 'nonzero')
    }
    if (this._applyStroke(ctx, cmd)) {
      ctx.stroke()
    }
    ctx.globalAlpha = 1
  }

  /**
   * @param {any} ctx
   * @param {any} cmd style-bearing flat command
   */
  _paintOne(ctx, cmd) {
    switch (cmd.tag) {
      case 'path': {
        if (cmd.nxs) {
          this._paintNumericPath(ctx, cmd)
          break
        }
        if (!cmd.d) return
        if (!cmd.path2d) {
          try {
            cmd.path2d = new Path2D(cmd.d)
          } catch (e) {
            return
          }
        }
        this._fillStrokePath(ctx, cmd, cmd.path2d)
        break
      }
      case 'rect': {
        const p = new Path2D()
        if (cmd.radius && typeof (/** @type {any} */ (p).roundRect) === 'function') {
          /** @type {any} */ (p).roundRect(cmd.x1, cmd.y1, cmd.rw, cmd.rh, cmd.radius)
        } else {
          p.rect(cmd.x1, cmd.y1, cmd.rw, cmd.rh)
        }
        this._fillStrokePath(ctx, cmd, p)
        break
      }
      case 'circle': {
        if (!(cmd.r > 0)) return
        ctx.beginPath()
        ctx.arc(cmd.cx, cmd.cy, cmd.r, 0, TWO_PI)
        this._fillStroke(ctx, cmd)
        break
      }
      case 'line': {
        ctx.beginPath()
        ctx.moveTo(cmd.lx1, cmd.ly1)
        ctx.lineTo(cmd.lx2, cmd.ly2)
        this._strokeOnly(ctx, cmd)
        break
      }
      case 'text': {
        if (cmd.text == null) return
        ctx.save()
        ctx.globalAlpha = this._alpha
        ctx.fillStyle = cmd.fill || '#000'
        const size = cmd.fontSize || '11px'
        ctx.font = `${typeof size === 'number' ? size + 'px' : size} ${cmd.fontFamily || 'Helvetica, Arial, sans-serif'}`
        ctx.textAlign =
          cmd.textAnchor === 'middle'
            ? 'center'
            : cmd.textAnchor === 'end'
              ? 'right'
              : 'left'
        ctx.fillText(String(cmd.text), cmd.tx, cmd.ty)
        ctx.restore()
        break
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
      ctx.fill(path2d, style.fillRule === 'evenodd' ? 'evenodd' : 'nonzero')
    }
    if (this._applyStroke(ctx, style)) {
      ctx.stroke(path2d)
    }
    ctx.globalAlpha = 1
  }

  /**
   * @param {any} ctx
   * @param {any} style
   */
  _fillStroke(ctx, style) {
    if (this._applyFill(ctx, style)) ctx.fill()
    if (this._applyStroke(ctx, style)) ctx.stroke()
    ctx.globalAlpha = 1
  }

  /**
   * @param {any} ctx
   * @param {any} style
   */
  _strokeOnly(ctx, style) {
    if (this._applyStroke(ctx, style)) ctx.stroke()
    ctx.globalAlpha = 1
  }

  /**
   * Set fill state. Returns false when there's nothing to fill.
   * @param {any} ctx
   * @param {any} style
   */
  _applyFill(ctx, style) {
    const fill = style.fill
    if (!fill || fill === 'none') return false
    // Gradient/pattern url()s are gated to the SVG renderer; if one slips
    // through, skip the fill rather than throw.
    if (typeof fill === 'string' && fill.indexOf('url(') === 0) return false
    ctx.globalAlpha =
      (style.fillOpacity == null ? 1 : Number(style.fillOpacity)) * this._alpha
    ctx.fillStyle = fill
    return true
  }

  /**
   * Set stroke state. Returns false when there's nothing to stroke.
   * @param {any} ctx
   * @param {any} style
   */
  _applyStroke(ctx, style) {
    const stroke = style.stroke
    const sw = style.strokeWidth == null ? 1 : Number(style.strokeWidth)
    if (!stroke || stroke === 'none' || !(sw > 0)) return false
    if (typeof stroke === 'string' && stroke.indexOf('url(') === 0) return false
    ctx.globalAlpha =
      (style.strokeOpacity == null ? 1 : Number(style.strokeOpacity)) *
      this._alpha
    ctx.strokeStyle = stroke
    ctx.lineWidth = sw
    ctx.lineCap = style.lineCap || 'butt'
    const dash = style.strokeDash
    if (dash && dash !== 0) {
      ctx.setLineDash(Array.isArray(dash) ? dash : [Number(dash)])
    } else {
      ctx.setLineDash([])
    }
    return true
  }

  /** Series bitmap for the export composite bridge (P4). @returns {string|null} */
  toDataURL() {
    return this._canvas ? this._canvas.toDataURL() : null
  }

  destroy() {
    this._host = null
    this._canvas = null
    this._c2d = null
    this._unitPaths.clear()
  }
}
