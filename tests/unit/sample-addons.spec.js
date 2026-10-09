/**
 * Every sample loads the add-ons its chart needs.
 *
 * A type or feature outside the default bundle reaches a script-tag page only
 * as its own file after apexcharts.js, and a sample that forgets it fails
 * quietly: a throw inside render() that nobody awaits, an empty plot, or a
 * wrong one. Nothing else in CI sees that during a release cycle, because the
 * e2e pass runs against the committed dist of the last release. This reads the
 * sample sources instead, so it holds whatever dist is on disk.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, sep } from 'path'
import addons from '../../samples/source/addons.js'

const { requiredAddons, loadedAddons, TYPE_ADDONS } = addons
const ROOT = join(__dirname, '../../samples/source')

function sampleFiles(dir = ROOT) {
  return readdirSync(dir).flatMap((e) => {
    const p = join(dir, e)
    if (statSync(p).isDirectory()) return sampleFiles(p)
    return p.endsWith('.xml') ? [p] : []
  })
}

const samples = sampleFiles().map((p) => ({
  rel: relative(ROOT, p).split(sep).join('/'),
  xml: readFileSync(p, 'utf8'),
}))

describe('sample add-ons', () => {
  it('finds the samples', () => {
    expect(samples.length).toBeGreaterThan(300)
  })

  it('every sample loads what its chart types and features need', () => {
    const gaps = samples
      .map(({ rel, xml }) => ({
        rel,
        missing: requiredAddons(xml, rel).filter(
          (a) => !loadedAddons(xml).includes(a),
        ),
      }))
      .filter((g) => g.missing.length)
      .map(
        (g) =>
          `${g.rel}: add ${g.missing.map((a) => `<script src="../../../${a}"></script>`).join(' ')} at the top of <scripts>`,
      )
    expect(gaps).toEqual([])
  })

  it('loads a feature after the type it reshapes', () => {
    // raincloud's statistics feature works in either order, but a type file
    // first is the order the docs teach, so the samples show it.
    for (const { rel, xml } of samples) {
      const loaded = loadedAddons(xml)
      const r = loaded.indexOf('dist/features/raincloud.js')
      if (r >= 0) expect(loaded.indexOf('dist/violin.js'), rel).toBeLessThan(r)
    }
  })

  describe('detection', () => {
    const wrap = (code, scripts = '') =>
      `<title>t</title>\n${scripts ? `<scripts>\n${scripts}\n</scripts>\n` : ''}<chart>\n<options>\n${code}\n</options>\n</chart>`

    it('reads chart and series types', () => {
      expect(requiredAddons(wrap("chart: { type: 'unit' }"), 'x.xml')).toEqual([
        'dist/unit.js',
      ])
      expect(
        requiredAddons(wrap("series: [{ type: 'violin' }]"), 'x.xml'),
      ).toEqual(['dist/violin.js'])
      expect(
        requiredAddons(wrap("chart: { type: 'raincloud' }"), 'x.xml'),
      ).toEqual(TYPE_ADDONS.raincloud)
    })

    it('ignores a type that is only mentioned in a comment or in prose', () => {
      expect(
        requiredAddons(wrap("// chart: { type: 'unit' }"), 'x.xml'),
      ).toEqual([])
      expect(requiredAddons(wrap("/* type: 'sunburst' */"), 'x.xml')).toEqual(
        [],
      )
      expect(
        requiredAddons("<html><code>type: 'unit'</code></html>", 'x.xml'),
      ).toEqual([])
    })

    it('counts drilldown only when it is switched on', () => {
      expect(
        requiredAddons(wrap('drilldown: { enabled: true }'), 'x.xml'),
      ).toEqual(['dist/features/drilldown.js'])
      // sunburst and icicle read drilldown.series as plain data.
      expect(
        requiredAddons(
          wrap("chart: { type: 'pie' }, drilldown: { series: [] }"),
          'x.xml',
        ),
      ).toEqual([])
    })

    it('reads only the library files a <scripts> block loads', () => {
      const xml = wrap(
        '',
        '<script src="../../../dist/unit.js"></script>\n<script src="../../assets/data.js"></script>\n<script>var a = 1</script>',
      )
      expect(loadedAddons(xml)).toEqual(['dist/unit.js'])
    })
  })
})
