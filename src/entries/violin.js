// @ts-check
/**
 * ApexCharts — violin entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/violin'
 *
 * Registers: violin. Not in the default bundle since 8.0: add this next to
 * `import ApexCharts from 'apexcharts'`, load `dist/violin.js` after the
 * script tag, or use the full bundle. A raincloud draws through it too.
 */
import ApexCharts from '../apexcharts'
import Violin from '../charts/Violin'

ApexCharts.use({
  violin: Violin,
})

export default ApexCharts
