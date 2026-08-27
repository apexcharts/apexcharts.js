// @ts-check
/**
 * ApexCharts — streamgraph feature.
 *
 * `chart.type: 'streamgraph'` renders through the range-area pathway: a
 * streamgraph band IS a band between two per-x edges, so it needs no renderer
 * of its own. What it does need is the arithmetic that decides where those
 * edges go (the band order and the wiggle baseline) and the names written on
 * the bands in place of a legend, and both live here so a bundle that never
 * draws a streamgraph pays for neither.
 *
 * Usage:
 *
 *   import ApexCharts from 'apexcharts/core'
 *   import 'apexcharts/rangeArea'
 *   import 'apexcharts/features/streamgraph'
 *
 * or simply `import ApexCharts from 'apexcharts/streamgraph'`, which pulls in
 * the line/area renderer and this feature together.
 *
 * @module features/streamgraph
 */
import ApexCharts from '../apexcharts'
import StreamLabels from '../modules/streamgraph/StreamLabels'
import { streamgraphTransform } from '../modules/streamgraph/StreamData'
import { registerSeriesTransform } from '../modules/SeriesTransformRegistry'

registerSeriesTransform('streamgraph', streamgraphTransform)
ApexCharts.registerFeatures({ streamgraph: StreamLabels })

export default ApexCharts
export { streamgraphTransform }
