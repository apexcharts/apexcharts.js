// @ts-check
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
