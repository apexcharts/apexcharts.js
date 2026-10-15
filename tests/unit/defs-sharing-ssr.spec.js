// Server output carries the shared defs too: a bar chart with a drop shadow
// and an image fill renders one filter and one pattern per series, and every
// url(#id) it paints with names an element in the same SVG.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import '../../src/entries/standard.js'

const data = (n, k) => Array.from({ length: n }, (_, i) => i + k)

describe('shared defs under SSR', () => {
  let saved
  beforeEach(() => {
    saved = [global.window, global.document, global.navigator]
    global.window = undefined
    global.document = undefined
    global.navigator = undefined
    BrowserAPIs._resetShim()
  })
  afterEach(() => {
    ;[global.window, global.document, global.navigator] = saved
    BrowserAPIs._resetShim()
  })

  it('one filter and one pattern per series, none dangling', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: {
        type: 'bar',
        width: 600,
        height: 300,
        dropShadow: { enabled: true },
      },
      series: [{ data: data(20, 1) }, { data: data(20, 3) }],
      fill: { type: 'image', image: { src: ['a.png', 'b.png'] } },
    })
    const ids = new Set([...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]))
    const refs = [...svg.matchAll(/url\(#([^)]+)\)/g)].map((m) => m[1])
    expect(refs.length).toBeGreaterThan(40)
    expect(refs.filter((r) => !ids.has(r))).toEqual([])
    expect((svg.match(/<filter /g) || []).length).toBe(2)
    expect((svg.match(/<pattern /g) || []).length).toBe(2)
  })

  it('a CSS variable colour passes through untouched', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'bar', width: 600, height: 300 },
      series: [{ data: data(5, 1) }],
      colors: ['var(--brand)'],
      fill: { type: 'gradient' },
    })
    expect(svg).toContain('var(--brand)')
  })
})
