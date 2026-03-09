// @ts-check
/**
 * ApexCharts — pie / donut / polarArea entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/pie'
 *
 * Registers: pie, donut, polarArea
 */
import ApexCharts from '../apexcharts'
import Pie from '../charts/Pie'

ApexCharts.use({
  pie: Pie,
  donut: Pie,
  polarArea: Pie,
})

export default ApexCharts
