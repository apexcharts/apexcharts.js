// @ts-check
/**
 * ApexCharts — violin entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/violin'
 *
 * Registers: violin
 */
import ApexCharts from '../apexcharts'
import Violin from '../charts/Violin'

ApexCharts.use({
  violin: Violin,
})

export default ApexCharts
