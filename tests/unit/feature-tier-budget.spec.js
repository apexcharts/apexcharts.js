/**
 * Guards the default-bundle budget (`plans/08-distribution-and-plugin-tiers.md`).
 *
 * `src/features/all.js` decides what every ApexCharts user downloads, including
 * the ones who never touch the feature. Plan 08 settled the rule before the v6
 * features shipped, and then nobody enforced it: sixteen commits appended a
 * one-line import and the default bundle grew by a quarter, most of it premium
 * code an unlicensed user cannot run without a watermark.
 *
 * A one-line import is too cheap a way to spend everyone's bytes, so this test
 * makes it cost a deliberate edit here as well, with a reviewer looking at the
 * rule. That is the whole point: not to forbid growth, but to stop it happening
 * by accident.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Tier 1: shipped by default. The classic seven predate the budget and are
 * grandfathered (plan 08 line 150); the rest each passed the three-part rule
 * (< ~5 KB gzipped over core, no peer dependency or separate asset, useful to
 * a majority of charts) when admitted.
 */
const TIER_1 = [
  // Grandfathered classics: these ARE the batteries.
  'exports',
  'legend',
  'toolbar',
  'annotations',
  'keyboard',
  'morph',
  'drilldown',
  // Admitted under the budget.
  'perspectives',
  'history',
  'weave',
  'renderer-canvas',
  'marks',
  'facet',
  'context-menu',
  'stats',
  // SCHEDULED FOR EVICTION. Plan 08 named these Tier 2 (line 140) and they were
  // added here anyway. They are released, so removing them is semver-major and
  // is happening one feature at a time. As each lands, move its name down to
  // TIER_2 below; that move is the checklist.
  'ink',
  'storyboard',
]

/**
 * Tier 2: reachable from both channels, in neither default bundle. Listed
 * explicitly rather than inferred, so re-adding one fails loudly with a name
 * rather than silently passing an "unknown import" check.
 */
const TIER_2 = ['trellis', 'measure', 'link']

const RULE = `
features/all.js is the tier boundary (plans/08-distribution-and-plugin-tiers.md).
A module belongs there only if ALL THREE hold:
  1. under ~5 KB gzipped on top of core,
  2. no peer dependency and no separate asset (worker, wasm, shader),
  3. useful to a majority of charts.
Everything else ships as a sub-path entry (bundlers) and a UMD add-on (script
tag) and is NOT imported by all.js. If you are adding a feature so it "just
works", document its entry point instead.`

describe('Tier-1 default-bundle budget', () => {
  const source = readFileSync(
    resolve(rootDir, 'src/features/all.js'),
    'utf8',
  )
  const imported = [...source.matchAll(/^import '\.\/([\w-]+)\.js'/gm)].map(
    (m) => m[1],
  )

  it('imports exactly the Tier-1 set, no more', () => {
    const unexpected = imported.filter((n) => !TIER_1.includes(n))
    expect(
      unexpected,
      `features/all.js imports ${unexpected.join(', ')}, which the Tier-1 list does not cover.\n${RULE}`,
    ).toEqual([])
  })

  it('still imports every Tier-1 feature', () => {
    const missing = TIER_1.filter((n) => !imported.includes(n))
    expect(
      missing,
      `features/all.js no longer imports ${missing.join(', ')}. Removing a Tier-1 feature is a breaking change for the default bundle; if that is intended, move it to TIER_2 here.`,
    ).toEqual([])
  })

  it.each(TIER_2)('keeps Tier-2 feature %s out of the default bundle', (name) => {
    expect(
      imported.includes(name),
      `features/all.js imports '${name}', which is Tier 2. Every user would pay for it.\n${RULE}`,
    ).toBe(false)
  })

  it('has a sub-path entry for every Tier-2 feature so both channels can opt in', async () => {
    const pkg = JSON.parse(
      readFileSync(resolve(rootDir, 'package.json'), 'utf8'),
    )
    for (const name of TIER_2) {
      expect(
        pkg.exports[`./features/${name}`],
        `Tier-2 feature '${name}' is out of the default bundle but has no './features/${name}' export, so a bundler user cannot reach it at all.`,
      ).toBeTruthy()
    }
  })

  // Read as text, not imported: pulling vite.config.mjs into jsdom drags in
  // esbuild, which refuses to load there.
  it('ships a script-loadable build for every Tier-2 feature', () => {
    const config = readFileSync(resolve(rootDir, 'vite.config.mjs'), 'utf8')
    const umdBlock = config.slice(config.indexOf('export const UMD_ENTRIES'))
    for (const name of TIER_2) {
      expect(
        umdBlock.includes(`'features/${name}'`),
        `Tier-2 feature '${name}' has no UMD_ENTRIES build, so a page without a bundler has NO way to reach it. Taking a feature out of the full bundle without giving the script-tag audience a replacement is a regression, not a saving.`,
      ).toBe(true)
    }
  })
})
