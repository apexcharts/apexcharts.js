// @ts-check
import { Environment } from '../utils/Environment.js'
import SvgRenderer from '../renderers/svg/SvgRenderer'
import {
  computeMarkCount,
  hasCanvasUnsupportedFeature,
} from '../renderers/Renderer'

/**
 * Strata (#2) — selects the active series `Renderer` and owns fallback.
 *
 * SVG is always available (core). Non-SVG renderers (canvas, later gpu) register
 * a factory via `RendererController.registerRenderer(kind, factory)` from their
 * tree-shakeable feature file (e.g. `apexcharts/features/renderer-canvas`).
 * When a requested/auto-selected backend is not registered, selection falls
 * back to SVG — so `renderer:'auto'`/`'canvas'` is safe even without the canvas
 * feature bundled.
 *
 * One controller per chart instance (`ctx.rendererController`, eager, core).
 * `resolve()` runs once per full render (after data is parsed, so the mark
 * count is known) and sets `ctx.renderer`.
 *
 * @module RendererController
 */
export default class RendererController {
  /**
   * kind -> factory(w, ctx) => Renderer. SVG is NOT in here (it is the built-in
   * default); this holds only opt-in backends.
   * @type {Map<string, (w: any, ctx: any) => any>}
   */
  static _rendererRegistry = new Map()

  /**
   * @param {string} kind
   * @param {(w: any, ctx: any) => any} factory
   */
  static registerRenderer(kind, factory) {
    RendererController._rendererRegistry.set(kind, factory)
  }

  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    this.svg = new SvgRenderer(w, ctx)
    /** @type {any} */
    this.active = this.svg
    /** @type {import('../renderers/Renderer').RendererKind} */
    this._activeKind = 'svg'
  }

  /**
   * The kind selection WANTS (before availability/fallback). Pure.
   * @returns {import('../renderers/Renderer').RendererKind}
   */
  _desiredKind() {
    const cfg = this.w.config.chart
    const mode = cfg.renderer || 'svg'

    // SSR (and any non-browser) always renders SVG.
    if (!Environment.isBrowser()) return 'svg'
    if (mode === 'svg') return 'svg'
    // A canvas-unsupported feature forces SVG regardless of mode.
    if (hasCanvasUnsupportedFeature(this.w)) return 'svg'
    if (mode === 'canvas') return 'canvas'

    // 'auto' — pick canvas once the rendered-mark count crosses the threshold.
    const marks = computeMarkCount(this.w)
    const threshold = cfg.rendererThreshold || 8000
    return marks >= threshold ? 'canvas' : 'svg'
  }

  /**
   * Resolve + instantiate the active renderer and set `ctx.renderer`. Falls
   * back to SVG (with a warning only when canvas was explicitly requested) if
   * the desired backend is not registered.
   * @returns {import('../renderers/Renderer').RendererKind}
   */
  resolve() {
    const mode = this.w.config.chart.renderer || 'svg'
    const desired = this._desiredKind()

    if (desired !== 'svg') {
      const factory = RendererController._rendererRegistry.get(desired)
      if (factory) {
        this.active = factory(this.w, this.ctx)
        this._activeKind = desired
        this.ctx.renderer = this.active
        // Mirror on globals so w-only modules (Series hover/legend restyle)
        // can reach the active renderer without threading ctx.
        this.w.globals.activeRenderer = this.active
        return this._activeKind
      }
      // The backend was requested/auto-selected but its feature isn't bundled.
      if (mode === desired) {
        console.warn(
          `[apexcharts] renderer:"${desired}" requested but that renderer is not bundled ` +
            `(import 'apexcharts/features/renderer-${desired}'); falling back to SVG.`,
        )
      }
    } else if (mode === 'canvas' && hasCanvasUnsupportedFeature(this.w)) {
      // Explicit canvas, but a configured feature (gradient/pattern/image fill,
      // or a state color-matrix filter) can't render on canvas yet — 'auto'
      // declines silently, explicit 'canvas' says why.
      console.warn(
        `[apexcharts] renderer:"canvas" requested but this chart uses a feature the ` +
          `canvas renderer does not render yet (gradient/pattern/image fill or a ` +
          `state color-matrix filter); falling back to SVG.`,
      )
    }

    this.active = this.svg
    this._activeKind = 'svg'
    this.ctx.renderer = this.active
    this.w.globals.activeRenderer = this.active
    return this._activeKind
  }

  /** @returns {import('../renderers/Renderer').RendererKind} */
  getActiveKind() {
    return this._activeKind
  }
}
