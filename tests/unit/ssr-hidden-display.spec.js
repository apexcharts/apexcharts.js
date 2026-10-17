import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import '../../src/entries/standard.js'

// A part hidden with an inline display:none is not drawn by the browser, so
// the server render must not draw it either.
describe('SSR keeps display:none on hidden SVG parts', () => {
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

  it('grid.show:false gridlines are hidden in the output', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line', width: 500, height: 300 },
      grid: { show: false },
      series: [{ data: [1, 2, 3] }],
    })
    const m = svg.match(/<g[^>]*apexcharts-gridlines-horizontal[^>]*>/)
    expect(m).toBeTruthy()
    expect(m[0]).toMatch(/display="none"/)
  })

  it('a shown grid carries no display attribute', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ data: [1, 2, 3] }],
    })
    const m = svg.match(/<g[^>]*apexcharts-gridlines-horizontal[^>]*>/)
    expect(m).toBeTruthy()
    expect(m[0]).not.toMatch(/display=/)
  })

  it('labels hidden by dataLabels.avoidOverlap.hide stay hidden', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line', width: 500, height: 300 },
      dataLabels: { enabled: true, avoidOverlap: { hide: true } },
      series: [
        { name: 'a', data: [10, 20, 30] },
        { name: 'b', data: [10.1, 20.1, 30.1] },
        { name: 'c', data: [10.2, 20.2, 30.2] },
      ],
    })
    expect(svg).toMatch(/<text[^>]*apexcharts-datalabel[^>]*display="none"/)
  })
})
