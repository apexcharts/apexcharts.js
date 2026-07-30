// @ts-check
/**
 * ApexCharts — sunburst (hierarchical radial / nested pie-donut) entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/sunburst'
 *
 * Registers: sunburst
 */
import ApexCharts from '../apexcharts'
import Sunburst from '../charts/Sunburst'

ApexCharts.use({
  sunburst: Sunburst,
})

export default ApexCharts
