// @ts-check
import ApexCharts from '../apexcharts'
import LinkedViews from '../modules/link/LinkedViews'
import Crossfilter from '../modules/link/Crossfilter'

// NOT in the default bundle (Tier 2: premium, and dashboard-scoped rather than
// useful to a majority of charts). Both channels opt in explicitly:
//
//   bundler     import 'apexcharts/features/link'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/link.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js.
//
// P1: per-chart linked-highlighting module (opt-in via chart.link.enabled).
ApexCharts.registerFeatures({ linkedViews: LinkedViews })

// Phase 2: install the crossfilter engine factory so ApexCharts.crossfilter(...)
// (declared in core, always callable) resolves the real coordinator. Without
// this feature the core static warns and no-ops, so the engine tree-shakes out.
const AC = /** @type {any} */ (ApexCharts)
/** @param {{id:string, records?:any[]}} opts */
AC._crossfilterFactory = (opts) => Crossfilter.getOrCreate(opts)
/** @param {string} id */
AC._crossfilterGet = (id) => Crossfilter.get(id)

export default ApexCharts
