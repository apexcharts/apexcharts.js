/**
 * Which of the library's own script-tag add-ons a sample has to load.
 *
 * A chart type or feature that is not in the default bundle reaches a page
 * without a bundler only as its own file, loaded after apexcharts.js: a type as
 * `dist/<type>.js`, a feature as `dist/features/<name>.js`. A sample that
 * forgets one does not fail loudly. Depending on the item it throws inside
 * render() (which nobody awaits), draws nothing, or draws a wrong chart, and
 * CI's e2e pass runs against the committed dist of the last release, which may
 * still carry the item. So `tests/unit/sample-addons.spec.js` checks every
 * sample against this list instead.
 *
 * The tags are harmless on a bundle that already has the item (the add-on
 * re-registers onto the same global registry), so samples carry them as soon
 * as an item is scheduled to leave the default bundle, not on the day it does.
 */

/** `chart.type` (or a series `type`) -> the add-on files it needs, in load order. */
const TYPE_ADDONS = {
  unit: ['dist/unit.js'],
  waffle: ['dist/unit.js'],
  sunburst: ['dist/sunburst.js'],
  icicle: ['dist/icicle.js'],
  violin: ['dist/violin.js'],
  // Drawn by the violin renderer, statistics from its own feature.
  raincloud: ['dist/violin.js', 'dist/features/raincloud.js'],
  streamgraph: ['dist/features/streamgraph.js'],
  waterfall: ['dist/features/waterfall.js'],
  dumbbell: ['dist/features/dumbbell.js'],
}

const DRILLDOWN_ADDON = 'dist/features/drilldown.js'

/**
 * Samples that pick a type at runtime (a morph button, a view switcher), so no
 * literal `type: '...'` names it. Keyed by path under samples/source.
 */
const RUNTIME_ADDONS = {
  'misc/chart-type-morph.xml': [
    'dist/unit.js',
    'dist/violin.js',
    'dist/sunburst.js',
  ],
  'treemap/treemap-sunburst-morph.xml': ['dist/sunburst.js'],
}

/** The sample's code with comments and `<code>` prose removed, so a mention is not a use. */
function codeOf(xml) {
  return xml
    .replace(/<code>[\s\S]*?<\/code>/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"])\/\/[^\n]*/g, '$1')
}

/**
 * The add-ons a sample needs, in load order.
 *
 * Drilldown counts only when it is switched on: sunburst and icicle read a
 * `drilldown.series` block as plain data and need no drilldown runtime.
 *
 * @param {string} xml the sample source
 * @param {string} rel its path under samples/source, with forward slashes
 * @returns {string[]}
 */
function requiredAddons(xml, rel) {
  const code = codeOf(xml)
  const need = []
  const add = (files) => files.forEach((f) => need.includes(f) || need.push(f))
  for (const m of code.matchAll(/\btype\s*:\s*['"](\w+)['"]/g)) {
    if (TYPE_ADDONS[m[1]]) add(TYPE_ADDONS[m[1]])
  }
  const at = code.indexOf('drilldown:')
  if (at >= 0 && /\benabled\s*:\s*true/.test(code.slice(at, at + 4000))) {
    add([DRILLDOWN_ADDON])
  }
  if (RUNTIME_ADDONS[rel]) add(RUNTIME_ADDONS[rel])
  return need
}

/**
 * The library add-ons a sample's `<scripts>` block loads, as `dist/...` paths.
 *
 * @param {string} xml
 * @returns {string[]}
 */
function loadedAddons(xml) {
  const start = xml.indexOf('<scripts>')
  const end = xml.indexOf('</scripts>')
  if (start < 0 || end < 0) return []
  return [
    ...xml
      .slice(start, end)
      .matchAll(/<script\s+src=["'](?:\.\.\/)+(dist\/[^"']+)["']/g),
  ].map((m) => m[1])
}

module.exports = {
  TYPE_ADDONS,
  DRILLDOWN_ADDON,
  RUNTIME_ADDONS,
  requiredAddons,
  loadedAddons,
}
