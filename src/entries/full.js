// @ts-check
/**
 * ApexCharts: the full bundle's entry point (everything).
 *
 *   <script src=".../dist/apexcharts.full.min.js"></script>
 *   import ApexCharts from 'apexcharts/full'
 *
 * The default bundle plus every chart type and feature that ships outside it,
 * and the unit-shape and pictogram catalogs registered by name. For a page or
 * an app that would rather load one file than choose: the default bundle stays
 * the small one, and this is the one that needs no add-on.
 *
 * Premium types and features are here too and stay licence-gated at runtime,
 * exactly as they are when loaded as add-ons.
 *
 * Built twice. The script-tag file inlines everything, the default bundle
 * included, because a script tag has no resolver. The bundler build
 * (`dist/full.esm.js`) takes the default bundle from `apexcharts` and the core
 * from `apexcharts/core` (vite.config.mjs), so an app that also imports
 * `apexcharts`, as every wrapper does, carries the default bundle once.
 *
 * Default export only. A named export turns the UMD build into a namespace
 * object, and `new ApexCharts()` on a script-tag page would throw.
 *
 * Never defines `__internals`: the default bundle it starts from already did,
 * on the same class, and a second non-configurable define throws.
 */
import ApexCharts from './standard.js'

// Chart types outside the default bundle.
import './violin.js'
import './unit.js'
import './sunburst.js'
import './icicle.js'
import './raincloud.js'

// Features outside the default bundle.
import '../features/drilldown.js'
import '../features/waterfall.js'
import '../features/dumbbell.js'
import '../features/streamgraph.js'
import '../features/trellis.js'
import '../features/measure.js'
import '../features/link.js'
import '../features/ink.js'
import '../features/storyboard.js'
import '../features/perspectives.js'
import '../features/renderer-canvas.js'
import '../features/context-menu.js'
import '../features/history.js'
import '../features/highlight-filter.js'

// The unit chart's catalogs, by name, as `dist/unit-shapes.js` and
// `dist/pictograms.js` register them. Their script-tag entries also hang the
// catalog off `globalThis.ApexCharts`, which does not exist yet while this
// bundle's own factory runs, so it is attached here instead.
import { catalog as unitShapes } from '../unit-shapes/catalog.js'
import { registerShapes } from '../unit-shapes/registry.js'
import { catalog as pictograms } from '../pictograms/catalog.js'
import { registerMarks } from '../pictograms/registry.js'

registerShapes(unitShapes)
registerMarks(pictograms)
const A = /** @type {any} */ (ApexCharts)
A.unitShapes = unitShapes
A.pictograms = pictograms

export default ApexCharts
