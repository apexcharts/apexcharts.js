// @ts-check

/**
 * The one warning for "this chart asked for a feature this bundle does not
 * contain", naming both ways to add it.
 *
 * Called through `globalThis.console`, never the bare `console`, and that is
 * the point of this module. `apexcharts.min.js` and the CommonJS builds are
 * minified with terser's `drop_console`, which removes every call rooted at
 * the bare `console` identifier and leaves `globalThis.console` alone. Written
 * the ordinary way, every one of these warnings was stripped from the exact
 * file a script tag loads, so a chart that lost a feature on upgrade failed in
 * silence there and warned only in the unminified build nobody ships.
 * `tests/unit/default-bundle-composition.spec.js` checks the built min file
 * still carries the text.
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
      `. Script tag: add ${tags} after apexcharts.js.` +
      (tail ? ` ${tail}` : ''),
  )
}
