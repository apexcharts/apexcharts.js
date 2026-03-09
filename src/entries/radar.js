// @ts-check
/**
 * ApexCharts — radar entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/radar'
 *
 * Registers: radar
 */
import ApexCharts from '../apexcharts'
import Radar from '../charts/Radar'

ApexCharts.use({
  radar: Radar,
})

export default ApexCharts
