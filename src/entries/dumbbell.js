// @ts-check
/**
 * ApexCharts: the dumbbell entry point.
 * Alias for 'apexcharts/bar' plus the dumbbell feature.
 *
 * A dumbbell draws through the range-bar renderer, so this registers bar (and
 * its stacked / rangeBar siblings) together with the endpoint merge.
 */
import '../features/dumbbell'

export { default } from './bar'
