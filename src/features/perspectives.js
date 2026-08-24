// @ts-check
//
// NOT in the default bundle (Tier 2: premium). Both channels opt in:
//
//   bundler     import 'apexcharts/features/perspectives'
//   script tag  <script src=".../dist/apexcharts.js"></script>
//               <script src=".../dist/features/perspectives.js"></script>
//
// The add-on reads its shared modules off `ApexCharts.__internals`, so load it
// AFTER apexcharts.js. `apexcharts/features/storyboard` imports this file, so a
// storyboard build already has perspectives and must not load both.
//
// Without it `chart.perspectives` and the `ApexCharts.perspectives` statics are
// null, so a call throws and names the missing piece; there is no `enabled`
// flag to hang a friendlier warning off.

import ApexCharts from '../apexcharts'
import Perspectives from '../modules/perspectives/Perspectives'
import { markPerspectivesTokenDecoded } from '../modules/license/LicenseEnforcer'

ApexCharts.registerFeatures({ perspectives: Perspectives })

// Static, pure helpers: attached from the feature file so core stays free of
// the Perspectives module (keeps it tree-shakeable). Present once the feature
// is imported: `import 'apexcharts/features/perspectives'`. Decoding a token
// via the static API is premium perspectives usage (there is no chart to tag),
// so it marks a process-global "in use" signal that re-evaluates live charts.
ApexCharts.perspectives = {
  /** @param {string} str */
  decode: (str) => {
    markPerspectivesTokenDecoded()
    return Perspectives.decode(str)
  },
  /** @param {string} [href] */
  fromURL: (href) => {
    markPerspectivesTokenDecoded()
    return Perspectives.fromURL(href)
  },
}

export default ApexCharts
