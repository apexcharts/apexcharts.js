// @ts-check
/**
 * The SVG `Renderer` implementation — a thin adapter over the existing
 * `Graphics` (and, later, `Fill`/`Filters`). It IS today's render path, just
 * behind the interface. Lives in core (always present): it adds ~no weight
 * because it delegates to modules that already ship.
 *
 * In P1 the per-type `draw()` methods are NOT yet swapped to route series emit
 * through the renderer (that is P2, paired with the Canvas renderer so the swap
 * can be validated against a real second backend). So the primitive methods
 * here are the tested contract surface that the Canvas renderer will mirror;
 * the high-level lifecycle methods are SVG-sensible no-ops/passthroughs (SVG
 * uses the DOM for identity/state/export, and subtree removal for clear).
 *
 * Implements the `Renderer` interface (see ../Renderer.js).
 *
 * @module renderers/svg/SvgRenderer
 */
export default class SvgRenderer {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** @type {import('../Renderer').RendererKind} */
    this.kind = 'svg'
  }

  // ── lifecycle (SVG builds its layer via the existing plotChartType flow) ──
  beginSeries() {}
  present() {
    return null
  }
  clear() {}

  // ── emit primitives (delegate to Graphics — the canvas renderer mirrors
  //    this exact surface) ──
  /** @param {any} attrs */
  group(attrs) {
    return this.ctx.graphics.group(attrs)
  }
  /** @param {any} opts */
  drawPath(opts) {
    return this.ctx.graphics.drawPath(opts)
  }
  /** @param {any[]} args */
  drawLine(...args) {
    return this.ctx.graphics.drawLine(...args)
  }
  /** @param {any[]} args */
  drawRect(...args) {
    return this.ctx.graphics.drawRect(...args)
  }
  /**
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r, attrs) {
    return this.ctx.graphics.drawCircle(r, attrs)
  }
  /** @param {any} opts */
  drawText(opts) {
    return this.ctx.graphics.drawText(opts)
  }
  /**
   * A series mark path (animation-aware). Faithful passthrough to Graphics.
   * Note: the SVG emit path in the per-type draw() methods routes through
   * `seriesEmitter`, which returns the caller's own `Graphics` in SVG mode — so
   * this method is the interface contract surface (mirrored by the canvas
   * renderer), not the hot path.
   * @param {any} opts
   */
  renderPaths(opts) {
    return this.ctx.graphics.renderPaths(opts)
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x, y, opts = {}) {
    return this.ctx.graphics.drawMarker(x, y, opts)
  }

  // ── capabilities — SVG supports everything the interface enumerates ──
  /** @param {string} _feature */
  supports(_feature) {
    return true
  }

  // ── interaction — the DOM does this natively in SVG mode ──
  hitTest() {
    return null
  }
  restyle() {}

  // ── export — SVG serializes directly; no bitmap to composite ──
  toBitmap() {
    return null
  }

  destroy() {}
}
