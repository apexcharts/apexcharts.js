// @ts-check
/**
 * ApexCharts — heatmap entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/heatmap'
 *
 * Registers: heatmap
 */
import ApexCharts from '../apexcharts'
import HeatMap from '../charts/HeatMap'

ApexCharts.use({
  heatmap: HeatMap,
})

export default ApexCharts
