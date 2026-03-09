// @ts-check
/**
 * ApexCharts — bar / column / rangeBar entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/bar'
 *
 * Registers: bar, column, barStacked, rangeBar
 * Excludes: line, area, scatter, bubble, candlestick, boxPlot, heatmap,
 *           treemap, pie, donut, polarArea, radialBar, radar, rangeArea
 */
import ApexCharts from '../apexcharts'
import Bar from '../charts/Bar'
import BarStacked from '../charts/BarStacked'
import RangeBar from '../charts/RangeBar'

ApexCharts.use({
  bar: Bar,
  column: Bar,
  barStacked: BarStacked,
  rangeBar: RangeBar,
})

export default ApexCharts
