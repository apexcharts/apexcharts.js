// @ts-check

/**
 * The one warning for "this chart asked for a feature this bundle does not
 * contain", naming the ways to add it: the import, the script-tag file, or the
 * full bundle, which has every feature.
 *
 * Called through `globalThis.console`. That dates from when `apexcharts.min.js`
 * and the CommonJS builds were minified with terser's `drop_console`, which
 * removed every call rooted at the bare `console`, so this warning (and every
 * other one) was silent in the exact file a script tag loads. The builds now
 * strip only log, info and debug (`COMPRESS` in vite.config.mjs), and
 * `tests/unit/default-bundle-composition.spec.js` checks the built files
 * still carry the warnings.
 *
 * Default export only: modules core imports can end up in the shared-module
 * surface, where a named export resolves to undefined in the split bundles.
 *
 * @param {string} subject what the user configured or called, e.g. "`chart.measure`"
 * @param {string} feature the module under `apexcharts/features/`
 * @param {{ module?: string, entry?: string, scripts?: string[], tail?: string }} [opts]
 *   `module`: what a bundler imports, under `apexcharts/` (default
 *   `features/<feature>`; a chart type names its own entry, which is what its
 *   docs say to import); `entry`: a sub-path entry that also brings the feature
 *   in (`apexcharts/<entry>`); `scripts`: the files a script tag adds, in load
 *   order, under `dist/` (default `features/<feature>.js`); `tail`: one more
 *   sentence, saying what the chart does instead
 */
export default function warnMissingFeature(subject, feature, opts = {}) {
  const {
    module = `features/${feature}`,
    entry,
    scripts = [`features/${feature}.js`],
    tail,
  } = opts
  const tags = scripts.map((f) => `<script src='.../dist/${f}'>`).join(' and ')
  globalThis.console.warn(
    `ApexCharts: ${subject} requires the ${feature} feature, which is not in this bundle. ` +
      `Bundler: import 'apexcharts/${module}'` +
      (entry ? ` (or from 'apexcharts/${entry}')` : '') +
      `. Script tag: add ${tags} after the ApexCharts script, ` +
      `or load apexcharts.full.min.js instead.` +
      (tail ? ` ${tail}` : ''),
  )
}
