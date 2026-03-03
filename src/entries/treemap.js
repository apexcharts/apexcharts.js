/**
 * ApexCharts — treemap entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/treemap'
 *
 * Registers: treemap
 */
import ApexCharts from '../apexcharts'
import Treemap from '../charts/Treemap'

ApexCharts.use({
  treemap: Treemap,
})

export default ApexCharts
