// @ts-check
/**
 * The script-tag build of the pictogram collection (`dist/pictograms.js`).
 *
 *     <script src="apexcharts.js"></script>
 *     <script src="pictograms.js"></script>
 *     ... plotOptions: { unit: { shape: 'pictogram', pictogram: { mark: 'person' } } }
 *
 * This entry is the ONLY side-effecting one: it registers every mark by name,
 * because a page without a bundler has nowhere else to put the call. The package
 * root stays pure, so `import { person }` never drags the catalog in.
 *
 * @module pictograms/cdn
 */

import { catalog } from './catalog.js'
import { registerMarks } from './registry.js'

export * from './index.js'

registerMarks(catalog)

// Also hang the collection off the global for discovery from a console.
const g = /** @type {any} */ (globalThis)
if (g.ApexCharts) g.ApexCharts.pictograms = catalog
