// @ts-check
//
// NOT in the default bundle (Tier 2: 5.4 KB gzipped, over the Tier-1 budget it
// was admitted under, and a minority of charts are large enough to want it).
// Both channels opt in explicitly:
//
//   bundler     import 'apexcharts/features/renderer-canvas'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/renderer-canvas.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js. Without it `renderer:'canvas'` warns and falls back to
// SVG, and `renderer:'auto'` falls back silently (that is what auto means).

import ApexCharts from '../apexcharts'
import CanvasRenderer from '../renderers/canvas/CanvasRenderer'

/**
 * Strata (#2): the tree-shakeable Canvas renderer feature.
 *
 * The `Renderer` interface, `RendererController`, and the SVG adapter live in
 * core (~zero weight, they wrap Graphics that already ships). The canvas backend
 * is THIS opt-in feature: `import 'apexcharts/features/renderer-canvas'`. Once
 * imported, `chart.renderer: 'canvas'` or `'auto'` (above `rendererThreshold`)
 * paints the dense series layer to canvas; without it, the controller falls back
 * to SVG. This is why Strata is additive: the whole canvas payload shakes out
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
