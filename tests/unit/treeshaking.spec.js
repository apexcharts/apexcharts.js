/**
 * Tree-shaking integrity tests for ApexCharts sub-entry dist files.
 *
 * These tests run against the built dist/ files (not source), so they require
 * a prior `node build/vite-build.mjs` run to be meaningful.
 *
 * What is tested:
 *   1. Sub-entries import from 'apexcharts/core' (not self-contained)
 *   2. No class is duplicated across core + sub-entry pairs
 *   3. Optional feature classes (Legend, Annotations, etc.) are absent from core
 *   4. Chart-type classes are confined to their own sub-entry (e.g. Bar not in line.esm.js)
 *   5. All __apex_* named exports declared in core.js source are present in core.esm.js
 *
 * @vitest-environment node
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')
const DIST = resolve(ROOT, 'dist')

// ─── helpers ────────────────────────────────────────────────────────────────

function dist(rel) {
  return resolve(DIST, rel)
}

function read(rel) {
  const p = dist(rel)
  if (!existsSync(p)) return null
  return readFileSync(p, 'utf-8')
}

/**
 * Count class declarations of exactly `name` (not a prefix of another class).
 * Matches "class Name {" and "class Name extends" but not "class NameFoo".
 */
function countClass(content, name) {
  const re = new RegExp(`class ${name}[\\s{]`, 'g')
  return (content.match(re) ?? []).length
}

// All sub-entry ESM files (relative to dist/)
const SUB_ENTRIES = [
  'line.esm.js',
  'bar.esm.js',
  'candlestick.esm.js',
  'pie.esm.js',
  'radial.esm.js',
  'heatmap.esm.js',
  'features/annotations.esm.js',
  'features/exports.esm.js',
  'features/keyboard.esm.js',
  'features/legend.esm.js',
  'features/toolbar.esm.js',
]

// ─── 1. Import structure ─────────────────────────────────────────────────────

describe('import structure', () => {
  test('core.esm.js does not import from apexcharts/core (it IS core)', () => {
    const core = read('core.esm.js')
    expect(core).not.toBeNull()
    expect(core).not.toContain('from "apexcharts/core"')
    expect(core).not.toContain("from 'apexcharts/core'")
  })

  test.each(SUB_ENTRIES)('%s imports from "apexcharts/core"', (file) => {
    const content = read(file)
    expect(content, `dist/${file} not found — run build first`).not.toBeNull()
    expect(content).toContain('from "apexcharts/core"')
  })

  test('full bundle apexcharts.esm.js does not import from apexcharts/core', () => {
    const full = read('apexcharts.esm.js')
    expect(full).not.toBeNull()
    expect(full).not.toContain('from "apexcharts/core"')
  })
})

// ─── 2. No class duplication ─────────────────────────────────────────────────

describe('no class duplication between core and sub-entries', () => {
  // Classes that must appear exactly once in core and zero times in each sub-entry.
  // These are the shared infrastructure classes bundled into core.esm.js.
  const CORE_ONLY_CLASSES = [
    'ApexCharts',
    'Graphics',
    'Utils',
    'CoreUtils',
    'Animations',
    'Fill',
    'Filters',
    'Markers',
    'Series',
    'Scales',
    'Formatters',
    'Tooltip',
    'DataLabels',
  ]

  let coreContent

  beforeAll(() => {
    coreContent = read('core.esm.js')
  })

  test('each core class appears exactly once in core.esm.js', () => {
    expect(coreContent).not.toBeNull()
    for (const name of CORE_ONLY_CLASSES) {
      const n = countClass(coreContent, name)
      expect(n, `"class ${name}" should appear once in core.esm.js, found ${n}`).toBe(1)
    }
  })

  test.each(SUB_ENTRIES)('%s contains zero copies of core-only classes', (file) => {
    const content = read(file)
    expect(content, `dist/${file} not found`).not.toBeNull()
    for (const name of CORE_ONLY_CLASSES) {
      const n = countClass(content, name)
      expect(n, `"class ${name}" must not be duplicated in dist/${file} (found ${n})`).toBe(0)
    }
  })
})

// ─── 3. Optional feature classes absent from core ────────────────────────────

describe('optional feature classes are absent from core.esm.js', () => {
  // These classes belong to optional feature modules. A user who only imports
  // core + line should not pay for any of these.
  const OPTIONAL_FEATURE_CLASSES = [
    { name: 'Legend',             feature: 'features/legend.esm.js' },
    { name: 'Annotations',        feature: 'features/annotations.esm.js' },
    { name: 'Toolbar',            feature: 'features/toolbar.esm.js' },
    { name: 'KeyboardNavigation', feature: 'features/keyboard.esm.js' },
  ]

  let coreContent

  beforeAll(() => {
    coreContent = read('core.esm.js')
  })

  test.each(OPTIONAL_FEATURE_CLASSES)(
    'class $name is absent from core.esm.js',
    ({ name }) => {
      expect(coreContent).not.toBeNull()
      const n = countClass(coreContent, name)
      expect(n, `"class ${name}" must not be in core.esm.js`).toBe(0)
    }
  )

  test.each(OPTIONAL_FEATURE_CLASSES)(
    'class $name is present in its own feature entry ($feature)',
    ({ name, feature }) => {
      const content = read(feature)
      expect(content, `dist/${feature} not found`).not.toBeNull()
      const n = countClass(content, name)
      expect(n, `"class ${name}" should be in dist/${feature}`).toBeGreaterThanOrEqual(1)
    }
  )
})

// ─── 4. Chart-type classes confined to their own sub-entry ───────────────────

describe('chart-type classes are confined to their own sub-entry', () => {
  // Note: Radial extends Pie (src/charts/Radial.js), so Pie is legitimately
  // present in radial.esm.js. It is therefore not listed in Radial's absentFrom.
  // Candlestick uses class BoxCandleStick (src/charts/BoxCandleStick.js).
  const CHART_TYPE_ISOLATION = [
    { name: 'Bar',           ownEntry: 'bar.esm.js',         absentFrom: ['line.esm.js', 'pie.esm.js', 'radial.esm.js'] },
    { name: 'Line',          ownEntry: 'line.esm.js',        absentFrom: ['bar.esm.js', 'pie.esm.js', 'radial.esm.js'] },
    { name: 'Pie',           ownEntry: 'pie.esm.js',         absentFrom: ['bar.esm.js', 'line.esm.js', 'heatmap.esm.js'] },
    { name: 'Radial',        ownEntry: 'radial.esm.js',      absentFrom: ['bar.esm.js', 'line.esm.js', 'pie.esm.js', 'heatmap.esm.js'] },
    { name: 'HeatMap',       ownEntry: 'heatmap.esm.js',     absentFrom: ['bar.esm.js', 'line.esm.js', 'pie.esm.js'] },
    { name: 'BoxCandleStick',ownEntry: 'candlestick.esm.js', absentFrom: ['bar.esm.js', 'line.esm.js', 'pie.esm.js'] },
  ]

  for (const { name, ownEntry, absentFrom } of CHART_TYPE_ISOLATION) {
    test(`class ${name} is present in ${ownEntry}`, () => {
      const content = read(ownEntry)
      expect(content, `dist/${ownEntry} not found`).not.toBeNull()
      const n = countClass(content, name)
      expect(n, `"class ${name}" should be in dist/${ownEntry}`).toBeGreaterThanOrEqual(1)
    })

    test.each(absentFrom)(`class ${name} is absent from %s`, (file) => {
      const content = read(file)
      expect(content, `dist/${file} not found`).not.toBeNull()
      const n = countClass(content, name)
      expect(n, `"class ${name}" must not be in dist/${file}`).toBe(0)
    })
  }
})

// ─── 5. All __apex_* exports declared in core.js source exist in core.esm.js ─

describe('core.esm.js contains all __apex_* named exports', () => {
  // Parse the source entry to find all declared __apex_* export names,
  // then verify each appears in the built core.esm.js output.
  test('every __apex_* name from src/entries/core.js is exported by core.esm.js', () => {
    const src = readFileSync(resolve(ROOT, 'src/entries/core.js'), 'utf-8')
    const built = read('core.esm.js')
    expect(built).not.toBeNull()

    // Extract names like __apex_Graphics, __apex_ChartFactory_register, etc.
    const declared = [...src.matchAll(/__apex_[\w]+/g)].map((m) => m[0])
    expect(declared.length, 'No __apex_* exports found in source').toBeGreaterThan(0)

    const missing = declared.filter((name) => !built.includes(name))
    expect(
      missing,
      `core.esm.js is missing these __apex_* exports: ${missing.join(', ')}`
    ).toHaveLength(0)
  })
})
