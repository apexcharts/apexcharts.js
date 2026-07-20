// @ts-check
import CanvasGraphics from './CanvasGraphics'
import CanvasCompositor from './CanvasCompositor'

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
 * fallback is the proper accessibility answer there. Animation is not yet
 * bridged, so a render paints the final frame directly.
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
    const g = this._g
    const n = g.rectCount ? g.rectCount() : 0
    if (!n) return null
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
    return null
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
    const margin = this._compositor._margin
    return {
      dataURL: url,
      x: (gl.translateX || 0) + (cfg.offsetX || 0) - margin,
      y: (gl.translateY || 0) + (cfg.offsetY || 0) - margin,
      w: (this.w.layout.gridWidth || 0) + margin * 2,
      h: (this.w.layout.gridHeight || 0) + margin * 2,
    }
  }

  destroy() {
    this._compositor.destroy()
  }
}
