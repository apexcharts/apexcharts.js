// @ts-check
/**
 * ApexCharts — unit (dot-cluster / pictogram) entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/unit'
 *
 * Registers: unit
 */
import ApexCharts from '../apexcharts'
import Unit from '../charts/Unit'

ApexCharts.use({
  unit: Unit,
})

export default ApexCharts
