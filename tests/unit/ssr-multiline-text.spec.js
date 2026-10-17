import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import '../../src/entries/standard.js'

// Multi-line text (an array category, title or data label) is drawn as one
// tspan per line. The browser renders every line at the text's x; the server
// render must too, instead of rejecting.
describe('SSR renders multi-line text', () => {
  let sw, sd, sn
  beforeEach(() => {
    sw = global.window
    sd = global.document
    sn = global.navigator
    global.window = undefined
    global.document = undefined
    global.navigator = undefined
    BrowserAPIs._resetShim()
  })
  afterEach(() => {
    global.window = sw
    global.document = sd
    global.navigator = sn
    BrowserAPIs._resetShim()
  })

  /** Every `<tspan data-newline>` must carry its text's x. */
  const expectNewlinesAtTextX = (svg, needle) => {
    const text = [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].find(
      (m) => m[2].includes(needle),
    )
    expect(text).toBeTruthy()
    const x = /\sx="([^"]*)"/.exec(text[1])[1]
    const newlines = [...text[2].matchAll(/<tspan\b([^>]*data-newline[^>]*)>/g)]
    expect(newlines.length).toBeGreaterThan(0)
    for (const [, attrs] of newlines) expect(attrs).toContain(`x="${x}"`)
  }

  it('array categories render every line at the label x', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'bar', width: 500, height: 300 },
      series: [{ data: [1, 2] }],
      xaxis: {
        categories: [
          ['Line a', 'Line b'],
          ['c', 'd'],
        ],
      },
    })
    expect(svg).toContain('Line a')
    expect(svg).toContain('Line b')
    expectNewlinesAtTextX(svg, 'Line b')
  })

  it('an array title renders every line', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line', width: 500, height: 300 },
      title: { text: ['a1', 'b2'] },
      series: [{ data: [1, 2] }],
    })
    expect(svg).toContain('a1')
    expect(svg).toContain('b2')
    expectNewlinesAtTextX(svg, 'b2')
  })

  it('an array data label renders every line', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'bar', width: 500, height: 300 },
      dataLabels: {
        enabled: true,
        formatter: (v) => ['top' + v, 'low' + v],
      },
      series: [{ data: [3, 4] }],
    })
    expect(svg).toContain('top3')
    expect(svg).toContain('low4')
    expectNewlinesAtTextX(svg, 'low4')
  })
})
