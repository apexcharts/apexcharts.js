/**
 * The upgrade path for every feature 7.0 evicted:
 *
 *   import ApexCharts from 'apexcharts'
 *   import 'apexcharts/features/trellis'
 *
 * This did not work. `dist/apexcharts.esm.js` inlined its own copy of the chart
 * class, `dist/features/*.esm.js` resolved `apexcharts/core` to a different
 * one, and the feature registry was the only registry in the codebase that was
 * not globalThis-backed. So the add-on registered into a Map no chart read: no
 * error, no warning, the feature just never appeared, and the app also shipped
 * ~130 KB gzipped of duplicate core for a 6 KB feature.
 *
 * Nothing in the unit suite could see it, because unit tests import from src/
 * where there is only ever one copy. It surfaced from the licence-enforcement
 * gate, which drives the BUILT bundle and started reporting "no watermark" for
 * every case once ink left the default bundle.
 *
 * These assert the two invariants that keep the pairing honest, against source
 * rather than dist so they run in the normal suite. The end-to-end proof lives
 * in the licence gate (`npm run check:license-enforcement`), which imports the
 * built default bundle and the built add-on together.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { createRequire } from 'module'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import InitCtxVariables from '../../src/modules/helpers/InitCtxVariables.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('default bundle composes with feature add-ons', () => {
  it('keeps the feature registry on globalThis, not on a class static', () => {
    // The specific failure: two copies of the module, two Maps, registrations
    // landing on the one the chart does not consult.
    const slot = globalThis['__apexcharts_features_v1__']
    expect(
      slot,
      'the feature registry must live in a globalThis slot so every copy of ' +
        'InitCtxVariables shares it',
    ).toBeInstanceOf(Map)
    expect(
      InitCtxVariables._featureRegistry,
      '_featureRegistry must read through to that slot, not shadow it',
    ).toBe(slot)
  })

  it('registers into the shared slot even via a second module reference', () => {
    class Marker {}
    InitCtxVariables.registerFeatures({ __compositionProbe: Marker })
    expect(globalThis['__apexcharts_features_v1__'].get('__compositionProbe')).toBe(
      Marker,
    )
    InitCtxVariables._featureRegistry.delete('__compositionProbe')
  })

  it('builds the ESM default bundle with apexcharts/core external', () => {
    // The structural half. If this pass is ever dropped, `import 'apexcharts'`
    // inlines core again and a bundler user gets two copies: the globalThis
    // registry keeps it WORKING, so the only symptom is a silently doubled
    // bundle, which no test would otherwise notice.
    const config = readFileSync(resolve(rootDir, 'vite.config.mjs'), 'utf8')
    expect(
      config.includes("mode === 'full-esm'"),
      'vite.config.mjs must keep the full-esm mode that externalises core',
    ).toBe(true)
    expect(
      config.includes("coreExternalPlugin({ target: 'core' }), svgInlineLoader()"),
      'the full-esm build must run coreExternalPlugin',
    ).toBe(true)

    const driver = readFileSync(resolve(rootDir, 'build/vite-build.mjs'), 'utf8')
    expect(
      driver.includes("mode: 'full-esm'"),
      'build/vite-build.mjs must run the full-esm pass after the main build',
    ).toBe(true)
  })

  // Rollup's default CJS interop assumes `require()` hands back the export
  // itself. dist/core.common.js is an __esModule file, so the class is on
  // `.default`, and the emitted call was `require("apexcharts/core").use(...)`.
  // Every published CJS sub-entry has thrown "h.use is not a function" on
  // require since they were introduced; nothing tested them. The default
  // bundle now resolves core the same way, so this would have spread the bug
  // to `require('apexcharts')` itself.
  describe('built CJS entry points can actually be required', () => {
    const dist = resolve(rootDir, 'dist')
    const req = createRequire(import.meta.url)
    const files = [
      'apexcharts.common.js',
      // The `node` export condition resolves `require('apexcharts')` to the SSR
      // build, not to apexcharts.common.js, so this is the file a Node caller
      // actually gets and the one an interop bug would strand first.
      'apexcharts.ssr.common.js',
      'core.common.js',
      'line.common.js',
      'bar.common.js',
      'features/legend.common.js',
      'features/ink.common.js',
      'features/trellis.common.js',
    ]

    for (const f of files) {
      it(`require('dist/${f}')`, () => {
        const abs = resolve(dist, f)
        if (!existsSync(abs)) return // dist not built in this checkout
        expect(() => req(abs)).not.toThrow()
      })
    }
  })
})
