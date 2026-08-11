// @ts-check
/**
 * ApexCharts — histogram entry point.
 * Alias for 'apexcharts/bar' plus the stats feature that bins a raw sample.
 *
 * A histogram draws through the bar renderer, so this registers bar (and its
 * stacked / rangeBar siblings) and the binning transform together.
 */
import '../features/stats'

export { default } from './bar'
