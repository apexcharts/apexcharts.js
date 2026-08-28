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
 * the raincloud statistics transform together. The full `apexcharts` bundle
 * does NOT include this feature: on the full bundle, add
 * `import 'apexcharts/features/raincloud'`. On a script-tag page, load
 * `dist/features/raincloud.js` after `dist/apexcharts.js` (or after
 * `dist/apexcharts.core.js` + `dist/violin.js`).
 */
import '../features/raincloud'

export { default } from './violin'
