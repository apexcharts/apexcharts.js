// @ts-check
/**
 * ApexCharts — line / area / scatter / bubble / rangeArea entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/line'
 *
 * Registers: line, area, scatter, bubble, rangeArea
 * Excludes: bar, candlestick, boxPlot, heatmap, treemap, pie, donut,
 *           polarArea, radialBar, radar, rangeBar
 */
import ApexCharts from '../apexcharts'
import Line from '../charts/Line'

ApexCharts.use({
  line: Line,
  area: Line,
  scatter: Line,
  bubble: Line,
  rangeArea: Line,
})

export default ApexCharts
