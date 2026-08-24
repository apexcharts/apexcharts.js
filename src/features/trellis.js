// @ts-check
/**
 * Trellis (#22): small multiples / faceting.
 *
 * Splits one dataset into a grid of panels by a facet key, where every panel
 * is a real ApexCharts chart and the trellis owns everything shared: the
 * split, the scale domains, the plot geometry (panels are pixel-aligned by
 * contract), the color-by-series-name map, the headers, one legend, one
 * toolbar and the responsive column count.
 *
 *   import ApexCharts from 'apexcharts/core'
 *   import 'apexcharts/line'
 *   import 'apexcharts/features/trellis'
 *
 *   new ApexCharts(el, {
 *     chart: { type: 'line', height: 620 },
 *     trellis: { by: 'region' },
 *     series: [{ name: 'Revenue', region: 'North', data: [...] }, ...],
 *   }).render()
 *
 * NOT in the default bundle (Tier 2: ~25 KB gzipped, and a minority of charts
 * are small multiples). Both channels opt in explicitly:
 *
 *   bundler     import 'apexcharts/features/trellis'
 *   script tag  <script src=".../dist/apexcharts.js"></script>
 *               <script src=".../dist/features/trellis.js"></script>
 *
 * The add-on reads its shared modules off `ApexCharts.__internals`, so it
 * layers onto the bundle already on the page rather than duplicating it. Load
 * it AFTER apexcharts.js. Without this feature, a config carrying `trellis.by`
 * warns and renders as a normal single chart.
 *
 * @module features/trellis
 */
import ApexCharts from '../apexcharts'
import Trellis from '../modules/trellis/Trellis'

ApexCharts.registerFeatures({ trellis: Trellis })

export default ApexCharts
