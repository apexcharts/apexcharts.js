// @ts-check
import ApexCharts from '../apexcharts'
import Measure from '../modules/measure/Measure'

// Measure ruler (#18): interactive measure / delta ruler.
// Opt-in via chart.measure.enabled.
ApexCharts.registerFeatures({ measure: Measure })

export default ApexCharts
