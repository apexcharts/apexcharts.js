// @ts-check
import ApexCharts from '../apexcharts'
import Perspectives from '../modules/perspectives/Perspectives'

ApexCharts.registerFeatures({ perspectives: Perspectives })

// Static, pure helpers — attached from the feature file so core stays free of
// the Perspectives module (keeps it tree-shakeable). Present once the feature
// is imported: `import 'apexcharts/features/perspectives'`.
ApexCharts.perspectives = {
  /** @param {string} str */
  decode: (str) => Perspectives.decode(str),
  /** @param {string} [href] */
  fromURL: (href) => Perspectives.fromURL(href),
}

export default ApexCharts
