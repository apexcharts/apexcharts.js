// @ts-check
/**
 * ApexCharts — lean core, script-loadable (`dist/apexcharts.core.js`).
 *
 * The `<script>` counterpart of `apexcharts/core`. It is the bare chart class:
 * no chart types, no optional features. On its own it renders nothing, which
 * is the point. A page adds only what it uses:
 *
 *   <script src=".../dist/apexcharts.core.js"></script>
 *   <script src=".../dist/line.js"></script>
 *   <script src=".../dist/features/legend.js"></script>
 *
 * This exists because tree-shaking only ever helped bundler users. A page
 * without a build step had exactly one artifact, so whatever shipped in the
 * default bundle was what it downloaded, with no way to decline. Plan 08 called
 * that the missing CDN channel; this is the baseline half of it.
 *
 * `apexcharts.js` is unchanged and still batteries-included. This is additive:
 * nobody has to migrate to it, and a page that wants everything should keep
 * loading the full bundle rather than assembling it from parts.
 *
 * Note this file is NOT smaller than `apexcharts/core` is for a bundler. A
 * bundler drops the `__apex_*` modules an app never imports; a script tag
 * cannot, because any add-on loaded later may reach for any of them through
 * `ApexCharts.__internals`. The saving comes from the types and features you
 * then choose not to load, not from the core itself.
 *
 * @module entries/core-umd
 */
import ApexCharts from '../apexcharts'
import * as coreInternals from './core.js'

/**
 * The shared-module surface add-ons resolve against. Identical in contract to
 * the one the full bundle attaches (see `entries/full.js`), so a given
 * `dist/features/*.js` layers onto either baseline unchanged.
 *
 * PRIVATE and unversioned: not in the type definitions, not semver-stable.
 */
Object.defineProperty(ApexCharts, '__internals', {
  value: coreInternals,
  enumerable: false,
  writable: false,
  configurable: false,
})

export default ApexCharts
