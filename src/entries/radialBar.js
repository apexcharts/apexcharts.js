// @ts-check
/**
 * ApexCharts — radialBar entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/radialBar'
 *
 * Registers: radialBar
 */
import ApexCharts from '../apexcharts'
import Radial from '../charts/Radial'

ApexCharts.use({
  radialBar: Radial,
})

export default ApexCharts
