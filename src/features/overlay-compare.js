// @ts-check
import ApexCharts from '../apexcharts'
import Compare from '../modules/compare/Compare'

// Overlay Compare (#18): measure/delta ruler (P1) + period ghosting (P2).
// Opt-in via chart.measure.enabled / chart.compare.enabled.
ApexCharts.registerFeatures({ overlayCompare: Compare })

export default ApexCharts
