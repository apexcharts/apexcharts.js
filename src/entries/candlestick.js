// @ts-check
/**
 * ApexCharts — candlestick / boxPlot entry point.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/candlestick'
 *
 * Registers: candlestick, boxPlot
 */
import ApexCharts from '../apexcharts'
import BoxCandleStick from '../charts/BoxCandleStick'

ApexCharts.use({
  candlestick: BoxCandleStick,
  boxPlot: BoxCandleStick,
})

export default ApexCharts
