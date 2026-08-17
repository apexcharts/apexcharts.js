// @ts-check
/**
 * The script-tag build of the shape collection (`dist/unit-shapes.js`).
 *
 *     <script src="apexcharts.js"></script>
 *     <script src="unit-shapes.js"></script>
 *     ... plotOptions: { unit: { layout: 'custom', positions: 'heart' } }
 *
 * This entry is the ONLY side-effecting one: it registers every shape by name,
 * because a page without a bundler has nowhere else to put the call. The package
 * root stays pure, so `import { heart }` never drags the catalog in.
 *
 * @module unit-shapes/cdn
 */

import { catalog } from './catalog.js'
import { registerShapes } from './registry.js'

export * from './index.js'

registerShapes(catalog)

// Also hang the collection off the global for discovery from a console.
const g = /** @type {any} */ (globalThis)
if (g.ApexCharts) g.ApexCharts.unitShapes = catalog
