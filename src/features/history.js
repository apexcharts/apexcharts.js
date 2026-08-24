// @ts-check
//
// NOT in the default bundle (Tier 2: premium). Both channels opt in:
//
//   bundler     import 'apexcharts/features/history'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/history.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js. Ink already snapshots through `ctx.history?.snapshot?.()`
// so a drag stays undoable when both are present and simply is not when only
// ink is.

import ApexCharts from '../apexcharts'
import History from '../modules/history/History'

ApexCharts.registerFeatures({ history: History })

export default ApexCharts
