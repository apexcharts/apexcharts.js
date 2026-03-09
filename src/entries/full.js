// @ts-check
/**
 * ApexCharts — full bundle entry point (all chart types).
 *
 * This is what the default import resolves to:
 *   import ApexCharts from 'apexcharts'
 *
 * Registers every built-in chart type. Use a sub-entry point instead
 * (e.g. 'apexcharts/line') to ship only the types you need.
 */
import ApexCharts from '../apexcharts'
import '../features/all.js'
import Bar from '../charts/Bar'
import BarStacked from '../charts/BarStacked'
import BoxCandleStick from '../charts/BoxCandleStick'
import HeatMap from '../charts/HeatMap'
import Line from '../charts/Line'
import Pie from '../charts/Pie'
import Radar from '../charts/Radar'
import Radial from '../charts/Radial'
import RangeBar from '../charts/RangeBar'
import Treemap from '../charts/Treemap'

ApexCharts.use({
  line: Line,
  area: Line,
  scatter: Line,
  bubble: Line,
  rangeArea: Line,
  bar: Bar,
  column: Bar,
  barStacked: BarStacked,
  rangeBar: RangeBar,
  candlestick: BoxCandleStick,
  boxPlot: BoxCandleStick,
  pie: Pie,
  donut: Pie,
  polarArea: Pie,
  radialBar: Radial,
  radar: Radar,
  heatmap: HeatMap,
  treemap: Treemap,
})

export default ApexCharts
