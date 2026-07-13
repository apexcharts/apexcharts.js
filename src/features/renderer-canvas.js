// @ts-check
import ApexCharts from '../apexcharts'
import CanvasRenderer from '../renderers/canvas/CanvasRenderer'

/**
 * Strata (#2) — the tree-shakeable Canvas renderer feature.
 *
 * The `Renderer` interface, `RendererController`, and the SVG adapter live in
 * core (~zero weight, they wrap Graphics that already ships). The canvas backend
 * is THIS opt-in feature: `import 'apexcharts/features/renderer-canvas'`. Once
 * imported, `chart.renderer: 'canvas'` or `'auto'` (above `rendererThreshold`)
 * paints the dense series layer to canvas; without it, the controller falls back
 * to SVG. This is why Strata is additive — the whole canvas payload shakes out
 * when unused.
 */
ApexCharts.registerRenderer(
  'canvas',
  /**
   * @param {any} w
   * @param {any} ctx
   */
  (w, ctx) => new CanvasRenderer(w, ctx),
)

export default ApexCharts
