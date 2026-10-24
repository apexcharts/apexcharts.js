// @ts-check
/**
 * ApexCharts: radialBar and gauge targets.
 *
 * Draws `plotOptions.radialBar.targets`, marks at a value on a ring (a
 * target, a limit, last period's reading), on the dial geometry core
 * publishes. Free, not licence-gated.
 *
 * NOT in the default bundle (Tier 2: gauge-scoped rather than useful to a
 * majority of charts). Both channels opt in explicitly:
 *
 *   bundler     import 'apexcharts/features/radial-targets'
 *   script tag  <script src=".../dist/apexcharts.js"></script>
 *               <script src=".../dist/features/radial-targets.js"></script>
 *
 * The add-on reads its shared modules off `ApexCharts.__internals`, so it
 * layers onto the bundle already on the page. Without this feature, a config
 * carrying targets warns once and the dial draws without them.
 *
 * @module features/radial-targets
 */
import ApexCharts from '../apexcharts'
import RadialTargets from '../modules/radialTargets/RadialTargets'

ApexCharts.registerFeatures({ radialTargets: RadialTargets })

export default ApexCharts
