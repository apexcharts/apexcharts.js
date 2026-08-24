// @ts-check
/**
 * The Tier-1 feature set: what `import ApexCharts from 'apexcharts'` and the
 * `<script>` bundle give you without being asked.
 *
 * THIS LIST IS A BUDGET, NOT AN INDEX. Every import here is weight that every
 * user downloads, including the ones who never touch the feature. A module
 * earns a line in this file only if all three hold:
 *
 *   1. under ~5 KB gzipped on top of core,
 *   2. no peer dependency and no separate asset (worker, wasm, shader),
 *   3. useful to a majority of charts.
 *
 * Anything else is Tier 2: it ships as a feature module and a sub-path entry,
 * it is reachable from both channels, and it is NOT imported here. See
 * `plans/08-distribution-and-plugin-tiers.md`. The classic seven below predate
 * the budget and are grandfathered; the rule governs new admissions.
 *
 * Adding an import here is a product decision about everyone's bundle. If you
 * are here to make a feature "just work", add its entry point to the docs
 * instead. `tests/unit/feature-tier-budget.spec.js` enforces the ceiling.
 *
 * For a minimal custom bundle, import only the features you need:
 *
 *   import 'apexcharts/features/legend'
 *   import 'apexcharts/features/exports'
 *   // etc. (tooltip is always included, it is part of core)
 */
import './exports.js'
import './legend.js'
import './toolbar.js'
import './annotations.js'
import './keyboard.js'
import './morph.js'
import './drilldown.js'
import './perspectives.js'
import './storyboard.js'
import './history.js'
import './weave.js'
import './renderer-canvas.js'
import './marks.js'
import './facet.js'
import './link.js'
import './ink.js'
import './context-menu.js'
import './stats.js'
