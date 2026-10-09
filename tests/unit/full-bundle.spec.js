/**
 * The full bundle: `apexcharts.full.js` for a script tag, `apexcharts/full`
 * for a bundler. Its whole promise is that nothing needs an add-on, so these
 * check it carries everything that ships outside the default bundle, and keep
 * checking as things are added: the type list, the alias transforms and the
 * feature modules are read from the source of truth, not restated here.
 *
 * Source-level, because the unit suite runs before the build in publish.yml
 * and between releases dist/ is the previous release. The built files are
 * checked after the build: `npm run check:size` budgets the minified file and
 * fails if it is not larger than the default one, and treeshaking.spec.js
 * reads the bundler build when it exists.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import ApexCharts from '../../src/entries/full.js'
import { hasChartClass } from '../../src/modules/ChartFactory'
import { getSeriesTransform } from '../../src/modules/SeriesTransformRegistry'
import {
  BUILTIN_TYPES,
  TYPE_FEATURES,
} from '../../src/modules/settings/TypeAliases'
import { catalog as unitShapes } from '../../src/unit-shapes/catalog.js'
import { catalog as pictograms } from '../../src/pictograms/catalog.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const src = (rel) => readFileSync(resolve(rootDir, rel), 'utf8')

/** The module specifiers a file imports, side-effect imports included. */
const importsOf = (rel) =>
  [
    ...src(rel).matchAll(/^import\s+(?:[^'"]+?\s+from\s+)?['"]([^'"]+)['"]/gm),
  ].map((m) => m[1].replace(/\.js$/, ''))

describe('the full bundle carries everything', () => {
  it.each(BUILTIN_TYPES)('registers the %s chart type', (type) => {
    expect(hasChartClass(type)).toBe(true)
  })

  it('supplies every alias type the transform its feature provides', () => {
    // The table of alias types that draw nothing without their feature.
    const types = Object.keys(TYPE_FEATURES)
    expect(types.length).toBeGreaterThan(0)
    for (const type of types) {
      expect(getSeriesTransform(type), `${type} has no transform`).toBeTruthy()
    }
  })

  it('imports every feature module, directly or through the default bundle', () => {
    const viaDefault = importsOf('src/entries/standard.js').includes(
      '../features/all',
    )
      ? importsOf('src/features/all.js').map((s) => s.replace(/^\.\//, ''))
      : []
    // Straight from the full entry, or through a type entry it imports (the
    // raincloud entry brings its feature).
    const fromFull = importsOf('src/entries/full.js')
    const direct = [
      ...fromFull,
      ...fromFull
        .filter((s) => s.startsWith('./'))
        .flatMap((s) => importsOf(`src/entries/${s.slice(2)}.js`)),
    ]
      .filter((s) => s.startsWith('../features/'))
      .map((s) => s.slice('../features/'.length))
    const missing = readdirSync(resolve(rootDir, 'src/features'))
      .filter((f) => f.endsWith('.js') && f !== 'all.js')
      .map((f) => f.replace(/\.js$/, ''))
      .filter((f) => !viaDefault.includes(f) && !direct.includes(f))
    expect(missing, 'features the full bundle leaves out').toEqual([])
  })

  it('registers both unit catalogs by name and hangs them off the class', () => {
    expect(ApexCharts.unitShapes).toBe(unitShapes)
    expect(ApexCharts.pictograms).toBe(pictograms)
    const layouts = Object.keys(globalThis.__apexcharts_unit_layouts__ || {})
    const marks = Object.keys(globalThis.__apexcharts_unit_marks__ || {})
    expect(layouts.length).toBeGreaterThanOrEqual(unitShapes.length)
    expect(marks.length).toBeGreaterThanOrEqual(pictograms.length)
    expect(layouts).toContain('heart')
    expect(marks).toContain('person')
  })

  it('exposes __internals for add-ons, without defining it a second time', () => {
    // The default bundle it starts from attaches it; a second
    // non-configurable define on the same class throws.
    expect(ApexCharts.__internals).toBeTruthy()
    expect(src('src/entries/full.js')).not.toMatch(/defineProperty\(/)
  })

  it('exports only a default, so the UMD build is the class itself', () => {
    expect(src('src/entries/full.js')).not.toMatch(/^export\s+(?!default\b)/m)
  })
})

describe('the full bundle is wired into the build and the package', () => {
  const config = src('vite.config.mjs')

  it('builds the script-tag pair as a self-contained baseline', () => {
    const umd = /\n {2}full: \{([^}]*)\}/.exec(
      config.slice(config.indexOf('export const UMD_ENTRIES')),
    )
    expect(umd, 'UMD_ENTRIES has no full item').not.toBeNull()
    expect(umd[1]).toContain("out: 'apexcharts.full.js'")
    expect(umd[1]).toContain("global: 'ApexCharts'")
    expect(umd[1]).toContain('alsoMin: true')
    // A shared add-on resolves core off the page; the baseline must carry it.
    expect(umd[1]).not.toContain('shared')
  })

  it('builds apexcharts/full on top of the default bundle, not beside it', () => {
    const subEntries = config.slice(
      config.indexOf('export const SUB_ENTRIES'),
      config.indexOf('export const UMD_ENTRIES'),
    )
    expect(subEntries).toContain(
      "full: resolve(__dirname, 'src/entries/full.js')",
    )
    expect(config).toContain(
      '...(isFullEntry ? [standardExternalPlugin()] : [])',
    )
  })

  it('exports ./full with types', () => {
    const pkg = JSON.parse(src('package.json'))
    expect(pkg.exports['./full']).toEqual({
      types: './types/apexcharts.d.ts',
      import: './dist/full.esm.js',
      require: './dist/full.common.js',
    })
  })

  it('budgets the minified file and requires it to outweigh the default one', () => {
    const budget = JSON.parse(src('build/size-budget.json'))
    const entry = budget.files['dist/apexcharts.full.min.js']
    expect(entry).toBeTruthy()
    expect(entry.largerThan).toBe('dist/apexcharts.min.js')
    expect(budget.slack[entry.slack]).toBeTruthy()
  })
})
