// @ts-check
/**
 * ApexCharts — waterfall entry point.
 * Alias for 'apexcharts/bar' plus the waterfall feature.
 *
 * A waterfall draws through the vertical range-column renderer, so this
 * registers bar (and its stacked / rangeBar siblings) together with the
 * accumulation and the connector layer.
 */
import '../features/waterfall'

export { default } from './bar'
