/**
 * The README's exact-version CDN URLs follow package.json.
 *
 * `npm run cdn:pin` moves them in the `chore: bump` step; this is what fails
 * when that step is skipped, before publish.yml ships a README that teaches the
 * previous release. The website and skill pins live in sibling repos, which CI
 * does not check out: `npm run check:cdn-pin` covers them locally.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import {
  findPins,
  pinnedUrls,
  stamp,
  problems,
  isPrerelease,
} from '../../build/cdn-pin.mjs'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const read = (p) => readFileSync(resolve(rootDir, p), 'utf-8')

describe('cdn-pin', () => {
  const text = [
    '<script src="https://cdn.jsdelivr.net/npm/apexcharts@7.9.1/dist/apexcharts.min.js"></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/apexcharts/7.9.1/apexcharts.min.js"></script>',
    'https://unpkg.com/apexcharts@8.0.0-rc.1/dist/sunburst.js',
    'https://cdn.jsdelivr.net/npm/apexcharts@7/dist/apexcharts.min.js',
    'https://cdn.jsdelivr.net/npm/apexcharts',
    'https://cdn.jsdelivr.net/npm/react-apexcharts@1.4.0/dist/react-apexcharts.min.js',
  ].join('\n')

  it('finds exact pins on every CDN, with their lines', () => {
    expect(findPins(text).map((p) => [p.line, p.version])).toEqual([
      [1, '7.9.1'],
      [2, '7.9.1'],
      [3, '8.0.0-rc.1'],
    ])
  })

  it('moves exact pins only: a major channel, the bare URL and a wrapper stay', () => {
    const out = stamp(text, '8.1.0').split('\n')
    expect(out[0]).toContain('npm/apexcharts@8.1.0/dist/')
    expect(out[1]).toContain('libs/apexcharts/8.1.0/apexcharts.min.js')
    expect(out[2]).toContain('apexcharts@8.1.0/dist/sunburst.js')
    expect(out.slice(3)).toEqual(text.split('\n').slice(3))
  })

  it('lists whole file URLs for --online, leaving out a bare version folder', () => {
    const src = `<script src="https://cdnjs.cloudflare.com/ajax/libs/apexcharts/8.1.0/sunburst.js"></script>
const CDN = 'https://cdn.jsdelivr.net/npm/apexcharts@8.1.0/dist/'`
    expect(pinnedUrls(src)).toEqual([
      'https://cdnjs.cloudflare.com/ajax/libs/apexcharts/8.1.0/sunburst.js',
    ])
  })

  it('reports a file with no pin, so a rewritten snippet cannot pass by omission', () => {
    expect(problems('npm install apexcharts', '8.1.0', 'x.md')).toEqual([
      'x.md: no exact-version CDN URL found',
    ])
  })

  it('the README pins the version in package.json', () => {
    const { version } = JSON.parse(read('package.json'))
    if (isPrerelease(version)) return
    expect(problems(read('README.md'), version, 'README.md')).toEqual([])
  })
})
