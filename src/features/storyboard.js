// @ts-check
import ApexCharts from '../apexcharts'
import Storyboard from '../modules/storyboard/Storyboard'

// Storyboard: scroll-driven chart choreography (scrollytelling).
//
// NOT in the default bundle (Tier 2: premium, and scrollytelling is a minority
// use). Both channels opt in explicitly:
//
//   bundler     import 'apexcharts/features/storyboard'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/storyboard.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js. Without it `chart.storyboard` is null and calling
// `.bind()` throws, which names the missing piece plainly enough that no extra
// core-side guard earns its bytes.
//
// Beats are
// Perspectives tokens, so bundling storyboard pulls in the perspectives
// feature: chart.perspectives is guaranteed wherever chart.storyboard is.
import './perspectives.js'

ApexCharts.registerFeatures({ storyboard: Storyboard })

export default ApexCharts
