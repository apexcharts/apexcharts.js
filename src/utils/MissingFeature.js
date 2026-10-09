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
 * @param {{ entry?: string, tail?: string }} [opts] `entry`: a sub-path entry
 *   that also brings the feature in (`apexcharts/<entry>`); `tail`: one more
 *   sentence, saying what the chart does instead
 */
export default function warnMissingFeature(subject, feature, opts = {}) {
  const { entry, tail } = opts
  globalThis.console.warn(
    `ApexCharts: ${subject} requires the ${feature} feature, which is not in this bundle. ` +
      `Bundler: import 'apexcharts/features/${feature}'` +
      (entry ? ` (or from 'apexcharts/${entry}')` : '') +
      `. Script tag: add <script src='.../dist/features/${feature}.js'> after apexcharts.js.` +
      (tail ? ` ${tail}` : ''),
  )
}
