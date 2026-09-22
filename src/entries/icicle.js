// @ts-check
/**
 * ApexCharts — icicle (cartesian partition) entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/icicle'
 *
 * The full `apexcharts` bundle does NOT register this type: it is opt-in, so a
 * chart that never draws a hierarchy never pays for one. On a script-tag page,
 * load `dist/icicle.js` after `dist/apexcharts.js` (or after
 * `dist/apexcharts.core.js`).
 *
 * Registers: icicle
 */
import ApexCharts from '../apexcharts'
import Icicle from '../charts/Icicle'

ApexCharts.use({
  icicle: Icicle,
})

export default ApexCharts
