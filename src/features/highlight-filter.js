// @ts-check
/**
 * ApexCharts: the highlight filter feature.
 *
 * Draws each value faded and a part of it solid in front, from the same
 * baseline: what a dashboard shows when a pick elsewhere leaves part of every
 * value behind. The part travels with the data (`highlight` on a point, or
 * `highlightData` on a series), so a pick and a clear are ordinary updates.
 *
 * NOT in the default bundle (Tier 2: premium, and dashboard-scoped rather than
 * useful to a majority of charts). Both channels opt in explicitly:
 *
 *   bundler     import 'apexcharts/features/highlight-filter'
 *   script tag  <script src=".../dist/apexcharts.js"></script>
 *               <script src=".../dist/features/highlight-filter.js"></script>
 *
 * The add-on reads its shared modules off `ApexCharts.__internals`, so load it
 * AFTER apexcharts.js.
 *
 * @module features/highlight-filter
 */
import ApexCharts from '../apexcharts'
import HighlightFilter from '../modules/highlightFilter/HighlightFilter'

ApexCharts.registerFeatures({ highlightFilter: HighlightFilter })

export default ApexCharts
