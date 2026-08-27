// @ts-check
/**
 * ApexCharts — streamgraph entry point.
 * Alias for 'apexcharts/rangeArea' plus the streamgraph feature.
 *
 * A streamgraph draws through the range-area renderer, so this registers line
 * (and its area / rangeArea siblings) together with the stacking and the band
 * labels.
 */
import '../features/streamgraph'

export { default } from './rangeArea'
