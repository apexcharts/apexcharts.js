// @ts-check
import ApexCharts from '../apexcharts'
import InkLayer from '../modules/ink/InkLayer'

// Ink Layer (#7): direct-manipulation annotation authoring.
//
// NOT in the default bundle (Tier 2: premium, and an authoring tool rather
// than something a majority of charts need). Both channels opt in explicitly:
//
//   bundler     import 'apexcharts/features/ink'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/ink.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js. Then opt in per annotation
// (annotations.points[].draggable) or globally (chart.ink.enabled).
ApexCharts.registerFeatures({ ink: InkLayer })

export default ApexCharts
