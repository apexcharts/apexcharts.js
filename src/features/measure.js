// @ts-check
import ApexCharts from '../apexcharts'
import Measure from '../modules/measure/Measure'

// Measure ruler (#18): interactive measure / delta ruler.
//
// NOT in the default bundle (Tier 2: premium, and a minority of charts use a
// ruler). Both channels opt in explicitly:
//
//   bundler     import 'apexcharts/features/measure'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/measure.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js. Then switch it on with chart.measure.enabled.
ApexCharts.registerFeatures({ measure: Measure })

export default ApexCharts
