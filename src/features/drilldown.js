// @ts-check
/**
 * ApexCharts: the drilldown feature (top-level `drilldown` config, and the
 * drillDown / drillUp / drillToRoot methods).
 *
 *   import ApexCharts from 'apexcharts'
 *   import 'apexcharts/features/drilldown'
 *
 * Not in the default bundle since 8.0. Script tag: load
 * `dist/features/drilldown.js` after the ApexCharts script, or use the full
 * bundle. Without it, a chart with `drilldown.enabled` warns once and draws
 * its root level, which does not navigate.
 *
 * @module features/drilldown
 */
import ApexCharts from '../apexcharts'
import Drilldown from '../modules/drilldown/Drilldown'

ApexCharts.registerFeatures({ drilldown: Drilldown })

export default ApexCharts
