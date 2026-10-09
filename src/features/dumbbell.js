// @ts-check
/**
 * ApexCharts: the dumbbell feature.
 *
 * `chart.type: 'dumbbell'` renders through the range-bar pathway: a dumbbell IS
 * an interval with its two ends marked, which `plotOptions.bar.isDumbbell` has
 * always drawn. What the type adds is the part a range bar has no opinion
 * about: taking the two measures as two ordinary series and merging them into
 * the one interval per row the renderer needs, while keeping hold of which
 * endpoint is which so the dots, the end labels, the connector and the tooltip
 * can all still name them.
 *
 * Usage:
 *
 *   import ApexCharts from 'apexcharts/core'
 *   import 'apexcharts/bar'
 *   import 'apexcharts/features/dumbbell'
 *
 * or simply `import ApexCharts from 'apexcharts/dumbbell'`, which pulls in the
 * bar renderer and this feature together.
 *
 * Not in the default bundle since 8.0: add `import 'apexcharts/dumbbell'` next
 * to `import ApexCharts from 'apexcharts'`. Script tag: load
 * `dist/features/dumbbell.js` after the ApexCharts script, or use the full
 * bundle. Without it, a dumbbell chart warns once and draws nothing.
 *
 * @module features/dumbbell
 */
import ApexCharts from '../apexcharts'
import { dumbbellTransform } from '../modules/dumbbell/DumbbellData'
import { registerSeriesTransform } from '../modules/SeriesTransformRegistry'

registerSeriesTransform('dumbbell', dumbbellTransform)

export default ApexCharts
export { dumbbellTransform }
