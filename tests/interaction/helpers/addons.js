/**
 * Load script-tag add-ons onto a page that already has an ApexCharts bundle,
 * the way a page without a bundler does: the bundle first, each add-on after.
 *
 * Since 8.0 the default bundle leaves out the unit, sunburst and violin types
 * and the drilldown, waterfall, dumbbell and streamgraph features. A spec that
 * drives one of them loads its add-on here rather than switching to the full
 * bundle, so the default bundle plus add-on, the path most pages take, is the
 * one under test.
 */

import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = resolve(__dirname, '..', '..', '..', 'dist')

/** Add-on name -> the dist files it needs, in load order. */
const FILES = {
  unit: ['unit.js'],
  sunburst: ['sunburst.js'],
  violin: ['violin.js'],
  icicle: ['icicle.js'],
  raincloud: ['violin.js', 'features/raincloud.js'],
  drilldown: ['features/drilldown.js'],
  waterfall: ['features/waterfall.js'],
  dumbbell: ['features/dumbbell.js'],
  streamgraph: ['features/streamgraph.js'],
}

/**
 * @param {import('@playwright/test').Page} page
 * @param {...string} names keys of FILES
 */
export async function addAddons(page, ...names) {
  const seen = new Set()
  for (const name of names) {
    const files = FILES[name]
    if (!files) throw new Error(`addAddons: no add-on named "${name}"`)
    for (const f of files) {
      if (seen.has(f)) continue
      seen.add(f)
      await page.addScriptTag({ path: resolve(DIST, f) })
    }
  }
}
