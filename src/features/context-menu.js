// @ts-check
//
// NOT in the default bundle (Tier 2: premium). Both channels opt in:
//
//   bundler     import 'apexcharts/features/context-menu'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/context-menu.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js. Its own items degrade the same way: "Measure from here"
// and "Annotate here" only appear when measure / ink are present too.

import ApexCharts from '../apexcharts'
import ContextMenu from '../modules/contextMenu/ContextMenu'

// Radial Actions (#chrome): right-click / long-press context menu.
// Opt-in via chart.contextMenu.enabled.
ApexCharts.registerFeatures({ contextMenu: ContextMenu })

export default ApexCharts
