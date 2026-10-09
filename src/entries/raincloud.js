// @ts-check
/**
 * ApexCharts — raincloud entry point (PREMIUM chart type).
 * Alias for 'apexcharts/violin' plus the raincloud feature that derives the
 * density (cloud) and five-number summary (box) from a raw sample.
 *
 * Usage:
 *   import ApexCharts from 'apexcharts/raincloud'
 *
 * A raincloud draws through the violin renderer, so this registers violin and
 * the raincloud statistics transform together. The default `apexcharts`
 * bundle carries neither since 8.0, so this is the one import to add next to
 * it. On a script-tag page, load `dist/violin.js` and then
 * `dist/features/raincloud.js` after the ApexCharts script, or use the full
 * bundle, which has both.
 */
import '../features/raincloud'

export { default } from './violin'
