/**
 * The bundle-size budget's arithmetic and its production-build checks.
 *
 * Deliberately never reads dist/. publish.yml runs the unit suite BEFORE it
 * builds, and between releases dist/ is the committed previous release, so a
 * spec that measured dist would be measuring the wrong bytes. The real files
 * are checked after the build by `npm run check:size` itself.
 */

import { describe, it, expect } from 'vitest'
import { gzipSync } from 'zlib'
import {
  roundUp,
  budgetFor,
  integrity,
  addonProblems,
} from '../../build/check-size.mjs'
import { gzipSize } from '../../build/gzip-size.mjs'

const SLACK = { pct: 0.01, step: 500 }
const banner = (v) =>
  `/*!\n * ApexCharts v${v}\n * (c) 2018-2026 ApexCharts\n */\n`

describe('gzipSize', () => {
  it('is zlib at its default level over the raw bytes', () => {
    const buf = Buffer.from('ApexCharts '.repeat(500))
    expect(gzipSize(buf)).toBe(gzipSync(buf).length)
  })
})

describe('budgetFor', () => {
  it('adds the slack and rounds up to the step', () => {
    // The 7.9.0 release, which the first budgets were set from.
    expect(budgetFor(298123, SLACK)).toBe(301500)
    expect(budgetFor(162903, SLACK)).toBe(165000)
  })

  it('never lands below the measured size', () => {
    for (const size of [1, 499, 500, 501, 268362]) {
      expect(budgetFor(size, SLACK)).toBeGreaterThanOrEqual(size)
    }
  })

  it('rounds to whole steps', () => {
    expect(roundUp(1)).toBe(500)
    expect(roundUp(500)).toBe(500)
    expect(roundUp(501)).toBe(1000)
  })
})

describe('integrity', () => {
  const sibling = Buffer.alloc(10000, 'x')
  const minified = (v = '7.9.0', body = 'a'.repeat(3000)) =>
    Buffer.from(banner(v) + body)

  it('accepts a minified build of this checkout', () => {
    expect(integrity(minified(), sibling, '7.9.0')).toEqual([])
  })

  it('rejects a build of another version', () => {
    const [problem] = integrity(minified('7.8.0'), sibling, '7.9.0')
    expect(problem).toMatch(/v7\.8\.0.*v7\.9\.0/)
  })

  it('rejects a file terser did not write (a development build puts the banner inside the UMD wrapper)', () => {
    const dev = Buffer.from('(function(global, factory) {\n' + banner('7.9.0'))
    expect(integrity(dev, null, '7.9.0').join()).toMatch(
      /does not start with the ApexCharts banner/,
    )
  })

  it('rejects a file that references a source map', () => {
    const buf = Buffer.from(
      banner('7.9.0') + 'a\n//# sourceMappingURL=apexcharts.min.js.map\n',
    )
    expect(integrity(buf, null, '7.9.0').join()).toMatch(/source map/)
  })

  it('rejects a file with the line count of unminified source', () => {
    const buf = Buffer.from(banner('7.9.0') + 'a;\n'.repeat(100))
    expect(integrity(buf, null, '7.9.0').join()).toMatch(/lines/)
  })

  it('rejects a "minified" file as large as its unminified sibling', () => {
    expect(
      integrity(minified('7.9.0', 'a'.repeat(9000)), sibling, '7.9.0').join(),
    ).toMatch(/unminified sibling/)
  })
})

describe('addonProblems', () => {
  it('passes add-ons under the ceiling', () => {
    expect(addonProblems([['dist/features/ink.js', 12000]], 40000)).toEqual([])
  })

  it('names an add-on over the ceiling as one that inlined core', () => {
    // An add-on that inlines core instead of reading it off the page global
    // is core-sized: the lean core alone is about 156 KB gzipped.
    const [problem] = addonProblems([['dist/unit.js', 156000]], 40000)
    expect(problem).toMatch(/dist\/unit\.js is 156,000 B/)
    expect(problem).toMatch(/inlined core/)
  })

  it('reports an add-on the build did not write', () => {
    expect(addonProblems([['dist/sunburst.js', null]], 40000)).toEqual([
      'dist/sunburst.js is missing.',
    ])
  })
})
