// @ts-check
import CanvasGraphics, { markBox } from './CanvasGraphics'
import CanvasCompositor from './CanvasCompositor'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'

/**
 * Strata (#2) P2: the Canvas `Renderer`. Records series marks into a display
 * list (via {@link CanvasGraphics}) and paints them into a `<canvas>` composited
 * inside the SVG tree (via {@link CanvasCompositor}). Everything else: axes,
 * grid, crosshairs, annotations, data labels, tooltip, legend: stays SVG, so
 * only the dense series layer leaves the DOM. This is the surgical-hybrid thesis.
 *
 * Lives in the tree-shakeable `apexcharts/features/renderer-canvas` feature;
 * registered via `ApexCharts.registerRenderer('canvas', ...)`. When absent, the
 * controller falls back to SVG.
 *
 * Scope: line / area / bar / scatter / bubble / candlestick marks; solid fills +
 * dashArray. Gradient/pattern/image fills and state color-matrix filters route
 * to SVG (the controller declines canvas).
 *
 * Interaction: shared tooltip / zoom / click are coordinate-based (pointsArray)
 * and need no per-mark node; hover + legend dim repaint via restyle(); PNG/SVG
 * export composites the series bitmap (Exports.inlineCanvasLayers). Per-point
 * dataPointSelection-visual and keyboard traversal are intentionally SVG-only:
 * they are low value on the dense data canvas targets, and the data-table
 * fallback is the proper accessibility answer there. Heatmap cells and
 * bar-like marks are the exception for the keyboard: they read one at a time,
 * so focus resolves its cell through findCell, or its mark through findMark,
 * and gets the tooltip and outline an SVG node does (KeyboardNavigation).
 * Animation is not yet bridged, so a render paints the final frame directly.
 *
 * Implements the `Renderer` interface (see ../Renderer.js).
 *
 * @module renderers/canvas/CanvasRenderer
 */
export default class CanvasRenderer {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** @type {import('../Renderer').RendererKind} */
    this.kind = 'canvas'
    this._g = new CanvasGraphics(w)
    this._compositor = new CanvasCompositor(w)
    /** @type {any} scratch context for hit-testing marks, made on first use */
    this._hitCtx = undefined
  }

  // ── lifecycle ──
  /** Start a fresh series display list for this render pass. */
  beginSeries() {
    this._g.reset()
  }

  /**
   * Finalize the pass: paint the recorded display list and return the SVG host
   * (a `<foreignObject><canvas>`) for `plotChartType` to composite into the tree.
   * @returns {any}
   */
  present() {
    const host = this._compositor.createHost()
    this._compositor.paint(this._g.displayList(), this._g)
    return host
  }

  /** Fast-path wipe of the series layer. */
  clear() {
    this._compositor.clear()
  }

  /**
   * Whether the existing <canvas> host can be repainted in place (it exists
   * and is still mounted). Used by the data-only fast update path to skip
   * recreating the foreignObject + backing store on every tick.
   * @returns {boolean}
   */
  canRepaintInPlace() {
    const host = this._compositor.getHost()
    return !!(host && host.node && host.node.isConnected)
  }

  /** Repaint the freshly recorded display list into the EXISTING canvas. */
  repaintInPlace() {
    this._compositor.paint(this._g.displayList(), this._g)
  }

  // ── emit primitives (delegate to the display-list shim) ──
  /** @param {any} attrs */
  group(attrs) {
    return this._g.group(attrs)
  }
  /** @param {any} opts */
  drawPath(opts) {
    return this._g.drawPath(opts)
  }
  /** @param {any[]} args */
  drawLine(...args) {
    return /** @type {any} */ (this._g).drawLine(...args)
  }
  /** @param {any[]} args */
  drawRect(...args) {
    return /** @type {any} */ (this._g).drawRect(...args)
  }
  /**
   * Columnar heatmap-cell rect (dense same-shape rects): recorded into typed
   * arrays, painted as style batches. Distinct from drawRect (object command)
   * so 100k cells don't allocate 100k retained commands.
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {any} opts
   */
  drawRectCell(x, y, w, h, opts) {
    return this._g.drawRectCell(x, y, w, h, opts)
  }
  /**
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r, attrs) {
    return this._g.drawCircle(r, attrs)
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x, y, opts) {
    return this._g.drawMarker(x, y, opts)
  }
  /** @param {any} opts */
  renderPaths(opts) {
    return this._g.renderPaths(opts)
  }
  /** @param {any} opts */
  drawText(opts) {
    return this._g.drawText(opts)
  }

  // ── capabilities ──
  /** @param {string} feature */
  supports(feature) {
    // P2 canvas does solid fills + dashArray only; the rest routes to SVG.
    return feature === 'solidFill' || feature === 'dashArray'
  }

  // ── interaction ──
  // Shared tooltips resolve via coordinate lookup (pointsArray), so those
  // need no per-mark query. Heatmap cells, and the bar-likes and markers of
  // an intersect tooltip, however, are hovered by point (the SVG path
  // hit-tests the node under the cursor); with them on canvas there is no
  // node, so hitTest and hitTestMarker resolve the recorded marks.
  /**
   * Find the cell under a plot-local point (0,0 = plot origin, the same space
   * as the recorded cell geometry). Reverse scan so a later-painted cell wins
   * when cells overlap (continuous-x edges). A linear scan stays well under a
   * frame even at 100k cells (~100k integer compares). Returns the cell's
   * series/dataPoint index plus its geometry for tooltip positioning, or null
   * when the point is off every cell.
   *
   * With no cell there, a bar-like mark (a recorded path standing for one
   * data point: a bar, a candle, half a box plot, a violin body) is looked
   * for instead, with the box of the path that was hit.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x?:number,y?:number,width?:number,height?:number})|null}
   */
  hitTest(px, py) {
    const g = this._g
    const n = g.rectCount ? g.rectCount() : 0
    const rx = g._crx
    const ry = g._cry
    const rw = g._crw
    const rh = g._crh
    for (let k = n - 1; k >= 0; k--) {
      const w = rw[k]
      const h = rh[k]
      if (w <= 0 || h <= 0) continue
      if (px >= rx[k] && px < rx[k] + w && py >= ry[k] && py < ry[k] + h) {
        return {
          seriesIndex: g._crsi[k],
          dataPointIndex: g._crdi[k],
          x: rx[k],
          y: ry[k],
          width: w,
          height: h,
        }
      }
    }
    return this._hitTestMarks(px, py)
  }

  /**
   * The bar-like mark painted over a plot-local point. Tested against the
   * painted shape, the way a hovered SVG path is: its fill, and its stroke
   * wherever one is painted, so the empty corners of a violin's bounding box
   * are not part of it while a candle's wick and a box plot's whiskers, which
   * are stroke alone, are; and none of the part its clip cuts off (a
   * clipped-away part of an SVG path takes no pointer either). Bar-likes
   * record in series order, which is also their paint order, so a reverse
   * scan finds the topmost. The box comes back with it: the one that path
   * spans, as the hovered SVG path measures.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x?:number,y?:number,width?:number,height?:number})|null}
   */
  _hitTestMarks(px, py) {
    const list = this._g.displayList()
    for (let k = list.length - 1; k >= 0; k--) {
      const cmd = list[k]
      if (cmd.tag !== 'path' || cmd.dj == null || !cmd.d) continue
      const filled = !!cmd.fill && cmd.fill !== 'none'
      const stroked =
        !!cmd.stroke && cmd.stroke !== 'none' && cmd.strokeWidth > 0
      if (!filled && !stroked) continue
      const clip = this._compositor.clipRect(cmd.clip)
      if (
        clip &&
        (px < clip.x ||
          px > clip.x + clip.width ||
          py < clip.y ||
          py > clip.y + clip.height)
      ) {
        continue
      }
      // Off the path's box, and past anything its stroke can reach out of
      // it (a mitred corner reaches furthest, at the default limit of 10
      // half widths), the point is off the mark: a dense chart only builds
      // a Path2D for the few marks near the pointer.
      const box = markBox(cmd)
      if (!box) continue
      const reach = stroked ? cmd.strokeWidth * 5 : 0
      if (
        px < box.x - reach ||
        px > box.x + box.width + reach ||
        py < box.y - reach ||
        py > box.y + box.height + reach
      ) {
        continue
      }
      const ctx = this._hitContext()
      if (!ctx) return null
      if (!cmd.path2d) {
        try {
          cmd.path2d = new Path2D(cmd.d)
        } catch (e) {
          continue
        }
      }
      const rule = cmd.fillRule === 'evenodd' ? 'evenodd' : 'nonzero'
      let hit = filled && ctx.isPointInPath(cmd.path2d, px, py, rule)
      if (!hit && stroked) {
        ctx.lineWidth = cmd.strokeWidth
        ctx.lineCap = cmd.lineCap || 'butt'
        hit = ctx.isPointInStroke(cmd.path2d, px, py)
      }
      if (hit) {
        return { seriesIndex: cmd.si, dataPointIndex: cmd.dj, ...box }
      }
    }
    return null
  }

  /**
   * The marker painted over a plot-local point, for a tooltip that shows on
   * the hovered point (intersect): on SVG the marker node under the pointer
   * names it, and on canvas there is none. Markers paint after every other
   * mark (CanvasCompositor.paint) in record order, so a reverse scan finds
   * the topmost, which is the one an SVG pointer would land on where a
   * scatter overlays bars. Tested against the painted shape, fill and
   * stroke, and only inside the marker clip they are painted through, as a
   * clipped-away SVG marker takes no pointer. Null when no sized marker of
   * a known data point is there.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,size:number})|null}
   */
  hitTestMarker(px, py) {
    const g = this._g
    const n = g.markerCount()
    if (!n) return null
    const clip = this._compositor.clipRect('marker')
    if (
      clip &&
      (px < clip.x ||
        px > clip.x + clip.width ||
        py < clip.y ||
        py > clip.y + clip.height)
    ) {
      return null
    }
    for (let k = n - 1; k >= 0; k--) {
      const size = g._msize[k]
      const x = g._mx[k]
      const y = g._my[k]
      const j = g._mdi[k]
      if (!(size > 0) || y !== y || j < 0) continue
      const style = g.markerStyle(k)
      const stroked =
        !!style?.stroke && style.stroke !== 'none' && style.strokeWidth > 0
      const halfStroke = stroked ? style.strokeWidth / 2 : 0
      // Every shape stays within about its size of the centre (a star
      // grows 15% past it), so anything further is off this marker.
      const reach = size * 1.2 + halfStroke
      const dx = px - x
      const dy = py - y
      if (dx < -reach || dx > reach || dy < -reach || dy > reach) continue
      let hit
      if (g._mshape[k] === 0) {
        hit = dx * dx + dy * dy <= (size + halfStroke) * (size + halfStroke)
      } else {
        hit = this._hitsMarkerShape(k, dx, dy, size, style, stroked)
      }
      if (hit) {
        return { seriesIndex: g._msi[k], dataPointIndex: j, x, y, size }
      }
    }
    return null
  }

  /**
   * Whether a point, relative to a non-circle marker's centre, is on its
   * painted shape: the same unit geometry the compositor paints it with.
   * @param {number} k  marker index
   * @param {number} dx
   * @param {number} dy
   * @param {number} size
   * @param {any} style
   * @param {boolean} stroked
   * @returns {boolean}
   */
  _hitsMarkerShape(k, dx, dy, size, style, stroked) {
    const ctx = this._hitContext()
    if (!ctx) return false
    let path
    try {
      path = new Path2D(this._g.markerPath(0, 0, this._g._mshape[k], size))
    } catch (e) {
      return false
    }
    const filled = !!style?.fill && style.fill !== 'none'
    if (filled && ctx.isPointInPath(path, dx, dy)) return true
    if (!stroked) return false
    ctx.lineWidth = style.strokeWidth
    ctx.lineCap = 'butt'
    return ctx.isPointInStroke(path, dx, dy)
  }

  /**
   * Find a bar-like mark by identity rather than by point: keyboard focus
   * knows the series and data point it is on. The first path recorded for
   * the pair, as the first `path[j]` of the series is on SVG (a box plot's
   * lower half, a violin's body), with the box it spans and its `d`, so a
   * focus outline can trace the painted shape. Null when nothing was painted
   * for that pair.
   * @param {number} seriesIndex  realIndex
   * @param {number} dataPointIndex
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,width:number,height:number,d:string})|null}
   */
  findMark(seriesIndex, dataPointIndex) {
    const list = this._g.displayList()
    for (let k = 0; k < list.length; k++) {
      const cmd = list[k]
      if (cmd.tag !== 'path' || !cmd.d) continue
      if (cmd.si !== seriesIndex || cmd.dj !== dataPointIndex) continue
      const box = markBox(cmd)
      if (!box) continue
      return { seriesIndex, dataPointIndex, ...box, d: cmd.d }
    }
    return null
  }

  /**
   * Find a marker by identity rather than by point (hitTestMarker): keyboard
   * focus knows the series and data point it is on. The topmost one painted
   * for the pair, as the hit test reports it, and only one the hit test
   * could report: sized, at a known y. With the shape it was painted in, as
   * a `d`, so a focus outline can trace it. Null when none was painted.
   * @param {number} seriesIndex  realIndex
   * @param {number} dataPointIndex
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,size:number,d:string})|null}
   */
  findMarker(seriesIndex, dataPointIndex) {
    const g = this._g
    for (let k = g.markerCount() - 1; k >= 0; k--) {
      if (g._msi[k] !== seriesIndex || g._mdi[k] !== dataPointIndex) continue
      const size = g._msize[k]
      const y = g._my[k]
      if (!(size > 0) || y !== y) continue
      const x = g._mx[k]
      const d = g.markerPath(x, y, g._mshape[k], size)
      return { seriesIndex, dataPointIndex, x, y, size, d }
    }
    return null
  }

  /**
   * Find a cell by identity rather than by point: keyboard focus knows the
   * series and data point it is on, and needs the box the cell was painted in
   * (plot-local, as hitTest returns it) to place the tooltip and draw a focus
   * outline. `radius` is the cells' shared corner radius. Null when no cell
   * was recorded for that pair.
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,width:number,height:number,radius:number})|null}
   */
  findCell(seriesIndex, dataPointIndex) {
    const g = this._g
    const n = g.rectCount ? g.rectCount() : 0
    const si = g._crsi
    const di = g._crdi
    for (let k = n - 1; k >= 0; k--) {
      if (si[k] === seriesIndex && di[k] === dataPointIndex) {
        return {
          seriesIndex,
          dataPointIndex,
          x: g._crx[k],
          y: g._cry[k],
          width: g._crw[k],
          height: g._crh[k],
          radius: g._cellRadius || 0,
        }
      }
    }
    return null
  }

  /**
   * A detached 2D context kept for isPointInPath. The painting context
   * carries the device-pixel and pad transform, which the point would
   * have to be pushed through first; this one stays at identity, so plot
   * px go in as they are.
   * @returns {any}
   */
  _hitContext() {
    if (this._hitCtx === undefined) {
      const canvas = /** @type {any} */ (BrowserAPIs.createElement('canvas'))
      this._hitCtx = (canvas?.getContext && canvas.getContext('2d')) || null
    }
    return this._hitCtx
  }

  /**
   * Repaint the retained series scene with a per-series dim spec (hover /
   * legend restyle). No geometry recompute: reuses the display list + marker
   * columns recorded at render time. Pass null to repaint at full opacity.
   * @param {{active:number, opacity:number}|null} [dim]
   */
  restyle(dim) {
    this._compositor.paint(this._g.displayList(), this._g, dim || null)
  }

  // ── export ── toBitmap() and the compositor's toDataURL() back
  //    Exports.inlineCanvasLayers, which inlines the series bitmap as an SVG
  //    <image> so PNG/SVG export includes the canvas layer in correct z-order.
  /** @returns {{dataURL:string,x:number,y:number,w:number,h:number}|null} */
  toBitmap() {
    const url = this._compositor.toDataURL()
    if (!url) return null
    const gl = this.w.globals
    const cfg = this.w.config.chart
    const pad = this._compositor._pad
    return {
      dataURL: url,
      x: (gl.translateX || 0) + (cfg.offsetX || 0) - pad.left,
      y: (gl.translateY || 0) + (cfg.offsetY || 0) - pad.top,
      w: (this.w.layout.gridWidth || 0) + pad.left + pad.right,
      h: (this.w.layout.gridHeight || 0) + pad.top + pad.bottom,
    }
  }

  destroy() {
    this._compositor.destroy()
    this._hitCtx = undefined
  }
}
