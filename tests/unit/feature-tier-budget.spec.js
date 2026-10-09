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
import { RESERVED_TYPES } from '../../src/modules/settings/TypeAliases.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

/**
 * Tier 1: shipped by default. The classic six predate the budget and are
 * grandfathered (plan 08 line 150; 8.0 ended it for drilldown and the three
 * 7.1.0 alias types, which are Tier 2 now); the rest each passed the
 * three-part rule (< ~5 KB gzipped over core, no peer dependency or separate
 * asset, useful to a majority of charts) when admitted.
 */
const TIER_1 = [
  // Grandfathered classics: these ARE the batteries.
  'exports',
  'legend',
  'toolbar',
  'annotations',
  'keyboard',
  'morph',
  // Admitted under the budget.
  'weave',
  'marks',
  'facet',
  'stats',
]

/**
 * Tier 2: reachable from both channels, in neither default bundle. Listed
 * explicitly rather than inferred, so re-adding one fails loudly with a name
 * rather than silently passing an "unknown import" check.
 */
const TIER_2 = [
  'trellis',
  'measure',
  'link',
  'ink',
  'storyboard',
  'renderer-canvas',
  'context-menu',
  'history',
  'perspectives',
  // Premium and dashboard-scoped: draws a part of each value over its faded
  // whole. Without it, parts are ignored with a one-time warning.
  'highlight-filter',
  // The first opt-in chart TYPE (premium, like trellis): chart.type
  // 'raincloud' warns and renders blank on the default bundle by design.
  'raincloud',
  // A grandfathered classic until 8.0, which ended the grandfathering: a
  // minority of charts navigate a hierarchy, and every page paid 4.5 KB for
  // it. Without it, `drilldown.enabled` warns and the root level draws.
  'drilldown',
  // The 7.1.0 alias types, grandfathered into Tier 1 until 8.0. Each backs a
  // first-class `chart.type` whose base renderer, without the feature, drew
  // the untransformed series as a WRONG chart; TYPE_FEATURES in Data.js now
  // makes that a blank chart and one warning that survives minification.
  'waterfall',
  'dumbbell',
  'streamgraph',
]

const RULE = `
features/all.js is the tier boundary (plans/08-distribution-and-plugin-tiers.md).
A module belongs there only if ALL THREE hold:
  1. under ~5 KB gzipped on top of core,
  2. no peer dependency and no separate asset (worker, wasm, shader),
  3. useful to a majority of charts.
Everything else ships as a sub-path entry (bundlers) and a UMD add-on (script
tag) and is NOT imported by all.js. If you are adding a feature so it "just
works", document its entry point instead.
NEW CHART TYPES default to Tier 2 (policy, 2026-08-31): sub-path entry, UMD
add-on, and a loud failure on the default bundle instead of a silent one. A
type with a class of its own goes in RESERVED_TYPES (TypeAliases.js), and
getChartClass names the import; an alias type whose statistics live in a
feature goes in TYPE_FEATURES (src/modules/Data.js), which warns and renders
blank. A single type is almost never "useful to a majority of charts"; a quiet
failure mode is fixed by the warning, not by bundling the type.
EVERY TIER-2 ITEM fails loudly, through a warning that survives the minified
build (src/utils/MissingFeature.js, never a bare console.warn).
8.0.0 ended grandfathering: drilldown and the 7.1.0 types moved out, so being
in the default bundle today is not a reason to stay there.`

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
        `Tier-2 feature '${name}' has no UMD_ENTRIES build, so a page without a bundler has NO way to reach it. Taking a feature out of the default bundle without giving the script-tag audience a replacement is a regression, not a saving.`,
      ).toBe(true)
    }
  })
})

/**
 * The chart types the default entry registers. A type with a class of its own
 * is either here or opt-in, and an opt-in type is reachable from both channels
 * and reserved, so its error names the import instead of leaving a blank
 * chart. Alias types (waterfall, histogram, ...) are not listed: they draw
 * through one of these, and their own statistics are features above.
 */
const STANDARD_TYPES = [
  'line',
  'area',
  'scatter',
  'bubble',
  'rangeArea',
  'bar',
  'column',
  'barStacked',
  'rangeBar',
  'candlestick',
  'boxPlot',
  'pie',
  'donut',
  'polarArea',
  'radialBar',
  'radar',
  'heatmap',
  'treemap',
]

/** Class-backed types the default entry does not register (since 8.0: unit, sunburst, violin). */
const OPT_IN_TYPES = ['icicle', 'unit', 'sunburst', 'violin']

describe('chart types in the default bundle', () => {
  const source = readFileSync(
    resolve(rootDir, 'src/entries/standard.js'),
    'utf8',
  )
  const use = /ApexCharts\.use\(\{([\s\S]*?)\}\)/.exec(source)
  const registered = use
    ? [...use[1].matchAll(/^\s*(\w+):/gm)].map((m) => m[1])
    : []

  it('registers exactly the standard types', () => {
    expect(
      [...registered].sort(),
      `src/entries/standard.js registers a different set of chart types than STANDARD_TYPES. A type in the default bundle is paid for by every page that loads it; a new one defaults to opt-in.\n${RULE}`,
    ).toEqual([...STANDARD_TYPES].sort())
  })

  it.each(OPT_IN_TYPES)(
    'opt-in type %s is reachable from both channels, and reserved',
    (type) => {
      const pkg = JSON.parse(
        readFileSync(resolve(rootDir, 'package.json'), 'utf8'),
      )
      expect(pkg.exports[`./${type}`], `no './${type}' export`).toBeTruthy()

      const config = readFileSync(resolve(rootDir, 'vite.config.mjs'), 'utf8')
      const umdBlock = config.slice(config.indexOf('export const UMD_ENTRIES'))
      const item = new RegExp(`'${type}': \\{([^}]*)\\}`).exec(umdBlock)
      expect(item, `no UMD_ENTRIES item for '${type}'`).not.toBeNull()
      expect(item[1]).toContain(`out: '${type}.js'`)
      expect(item[1]).toContain('shared: true')

      // Without the reservation, a missing opt-in type's error would advise
      // loading the default bundle, which does not carry it either.
      expect(RESERVED_TYPES).toContain(type)
      expect(registered).not.toContain(type)
    },
  )
})
