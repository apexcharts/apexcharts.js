// Users server-rendering an icicle got the cells but no cell labels and no
// "more below" marks: both renderers bailed outside a browser although they
// only create elements through BrowserAPIs and measure text by heuristic.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import '../../src/entries/icicle.js'

describe('icicle under SSR', () => {
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

  it('renders cell labels and the clipped-branch mark', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'icicle', width: 600, height: 400 },
      plotOptions: { icicle: { maxDepth: 1 } },
      series: [
        {
          data: [
            { x: 'Engineering', children: [{ x: 'Frontend', y: 300 }, { x: 'Backend', y: 200 }] },
            { x: 'Operations', y: 400 },
          ],
        },
      ],
    })
    expect(svg).toContain('apexcharts-icicle-cell')
    expect(svg).toMatch(/>Engineering[^<]*<\/text>/)
    expect(svg).toMatch(/>Operations[^<]*<\/text>/)
    expect(svg).toContain('apexcharts-icicle-more')
  })
})
