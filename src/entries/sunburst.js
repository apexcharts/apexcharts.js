// @ts-check
/**
 * ApexCharts — sunburst (hierarchical radial / nested pie-donut) entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/sunburst'
 *
 * Registers: sunburst. Not in the default bundle since 8.0: add this next to
 * `import ApexCharts from 'apexcharts'`, load `dist/sunburst.js` after the
 * script tag, or use the full bundle.
 */
import ApexCharts from '../apexcharts'
import Sunburst from '../charts/Sunburst'

ApexCharts.use({
  sunburst: Sunburst,
})

export default ApexCharts
