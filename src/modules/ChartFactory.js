/**
 * Chart Factory - Central registry for chart type classes
 *
 * This module provides lazy access to chart classes without requiring
 * them to be imported at the top of Core.js. While all charts are still
 * bundled in the main build, this structure improves code organization
 * and sets the foundation for future tree-shaking improvements.
 *
 * @module ChartFactory
 */

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

/**
 * Map of chart type names to their class constructors
 */
const chartClasses = {
  line: Line,
  area: Line,
  bar: Bar,
  column: Bar,
  barStacked: BarStacked,
  candlestick: BoxCandleStick,
  boxPlot: BoxCandleStick,
  rangeBar: RangeBar,
  rangeArea: Line,
  heatmap: HeatMap,
  treemap: Treemap,
  pie: Pie,
  donut: Pie,
  polarArea: Pie,
  radialBar: Radial,
  radar: Radar,
  scatter: Line,
  bubble: Line,
}

/**
 * Get the chart class for a given chart type
 * @param {string} type - Chart type name
 * @returns {Function} Chart class constructor
 */
export function getChartClass(type) {
  return chartClasses[type] || Line
}

/**
 * Create a new chart instance
 * @param {string} type - Chart type name
 * @param {Object} ctx - Chart context
 * @param {Object} xyRatios - XY ratios for axis charts
 * @param {boolean} isPointsChart - Whether this is a scatter/bubble chart
 * @returns {Object} Chart instance
 */
export function createChart(type, ctx, xyRatios, isPointsChart = false) {
  const ChartClass = getChartClass(type)
  return new ChartClass(ctx, xyRatios, isPointsChart)
}

/**
 * Check if chart type requires stacked bar handling
 * @param {string} type - Chart type
 * @param {Object} config - Chart config
 * @returns {boolean}
 */
export function isStackedBar(type, config) {
  return type === 'bar' && config.chart.stacked
}

/**
 * Get the BarStacked class for stacked bar charts
 * @returns {Function} BarStacked class
 */
export function getStackedBarClass() {
  return BarStacked
}

// Export individual classes for direct access if needed
export {
  Bar,
  BarStacked,
  BoxCandleStick,
  HeatMap,
  Line,
  Pie,
  Radar,
  Radial,
  RangeBar,
  Treemap,
}
