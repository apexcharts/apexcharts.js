// @ts-check
/**
 * ApexCharts — waterfall feature.
 *
 * `chart.type: 'waterfall'` renders through the vertical range-column pathway:
 * a waterfall bar IS a float between two levels, so it needs no renderer of its
 * own. What it does need is the arithmetic (deltas -> running totals) and the
 * connectors that join one bar's finish to the next one's start, and both live
 * here so a bundle that never draws a waterfall pays for neither.
 *
 * Usage:
 *
 *   import ApexCharts from 'apexcharts/core'
 *   import 'apexcharts/bar'
 *   import 'apexcharts/features/waterfall'
 *
 * or simply `import ApexCharts from 'apexcharts/waterfall'`, which pulls in the
 * bar renderer and this feature together.
 *
 * @module features/waterfall
 */
import ApexCharts from '../apexcharts'
import Waterfall from '../modules/waterfall/Waterfall'
import { waterfallTransform } from '../modules/waterfall/WaterfallData'
import { registerSeriesTransform } from '../modules/SeriesTransformRegistry'

registerSeriesTransform('waterfall', waterfallTransform)
ApexCharts.registerFeatures({ waterfall: Waterfall })

export default ApexCharts
export { waterfallTransform }
