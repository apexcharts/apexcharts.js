/**
 * The missing-feature warning, and the reason it has a module of its own.
 *
 * `apexcharts.min.js` is minified with terser's `drop_console`, which stripped
 * every one of these warnings from the file a script tag loads. The helper
 * calls `globalThis.console.warn`, which terser leaves alone. These tests run
 * terser over the helper's own source with the build's options, so a terser
 * upgrade that starts dropping it fails here, before any dist exists: the unit
 * suite runs before the build in publish.yml and reads a stale dist in CI.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { minify } from 'terser'
import warnMissingFeature from '../../src/utils/MissingFeature.js'

// The compress options vite.config.mjs gives apexcharts.min.js.
const BUILD_COMPRESS = { drop_console: true, drop_debugger: true }

describe('warnMissingFeature', () => {
  afterEach(() => vi.restoreAllMocks())

  it('names the subject and every way to add the feature', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnMissingFeature('`chart.measure`', 'measure')
    const [msg] = warn.mock.calls[0]
    expect(msg).toContain('`chart.measure` requires the measure feature')
    expect(msg).toContain("import 'apexcharts/features/measure'")
    expect(msg).toContain(
      "<script src='.../dist/features/measure.js'> after the ApexCharts script",
    )
    expect(msg).toContain('or load apexcharts.full.min.js instead.')
  })

  it('offers a sub-path entry and a closing sentence when given', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnMissingFeature("chart.type 'histogram'", 'stats', {
      entry: 'histogram',
      tail: 'Drawing nothing.',
    })
    const [msg] = warn.mock.calls[0]
    expect(msg).toContain(
      "import 'apexcharts/features/stats' (or from 'apexcharts/histogram')",
    )
    expect(msg.endsWith(' Drawing nothing.')).toBe(true)
  })

  it('takes the import and the script files a chart type documents', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warnMissingFeature("chart.type 'raincloud'", 'raincloud', {
      module: 'raincloud',
      scripts: ['violin.js', 'features/raincloud.js'],
    })
    const [msg] = warn.mock.calls[0]
    expect(msg).toContain("Bundler: import 'apexcharts/raincloud'.")
    expect(msg).toContain(
      "Script tag: add <script src='.../dist/violin.js'> and " +
        "<script src='.../dist/features/raincloud.js'> after the ApexCharts script",
    )
  })

  it('survives the minifier options the default bundle is built with', async () => {
    const src = readFileSync(
      resolve(__dirname, '../../src/utils/MissingFeature.js'),
      'utf8',
    )
    const { code } = await minify(src, {
      module: true,
      compress: BUILD_COMPRESS,
    })
    expect(code).toContain('console.warn')
    expect(code).toContain('which is not in this bundle')
  })

  it('is needed: the same options strip a bare console.warn', async () => {
    const { code } = await minify(
      "export default function f(){console.warn('which is not in this bundle')}",
      { module: true, compress: BUILD_COMPRESS },
    )
    expect(code).not.toContain('console.warn')
  })
})
