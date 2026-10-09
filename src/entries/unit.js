// @ts-check
/**
 * ApexCharts — unit (dot-cluster / pictogram) entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/unit'
 *
 * Registers: unit (and the `waffle` alias with it). Not in the default bundle
 * since 8.0: add this next to `import ApexCharts from 'apexcharts'`, load
 * `dist/unit.js` after the script tag, or use the full bundle.
 */
import ApexCharts from '../apexcharts'
import Unit from '../charts/Unit'

ApexCharts.use({
  unit: Unit,
})

export default ApexCharts
