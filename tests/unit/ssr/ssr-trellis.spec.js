import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import '../../../src/entries/standard.js'
import '../../../src/features/trellis.js'

// Trellis panels are drawn in the browser only. The host used to warn that
// SSR renders nothing and then reject with "Chart not properly initialized",
// failing the whole page render. It now emits an empty SVG of the requested
// size, which hydration fills on the client.
describe('SSR trellis host', () => {
  let savedWindow, savedDocument, savedNavigator, warn
  beforeEach(() => {
    savedWindow = global.window
    savedDocument = global.document
    savedNavigator = global.navigator
    global.window = undefined
    global.document = undefined
    global.navigator = undefined
    BrowserAPIs._resetShim()
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    global.window = savedWindow
    global.document = savedDocument
    global.navigator = savedNavigator
    BrowserAPIs._resetShim()
    warn.mockRestore()
  })

  const options = {
    chart: { type: 'line' },
    trellis: { by: 'region' },
    series: [
      { name: 'R', region: 'N', data: [3, 5, 2, 6] },
      { name: 'R', region: 'S', data: [1, 2, 3, 4] },
    ],
  }

  it('renders an empty placeholder SVG of the requested size', async () => {
    const svg = await SSRRenderer.renderToString(options, {
      width: 500,
      height: 320,
    })
    expect(svg).toMatch(/^<svg [^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/)
    expect(svg).toContain('width="500"')
    expect(svg).toContain('height="320"')
    expect(svg).toContain('apexcharts-ssr-placeholder')
  })

  it('wraps the placeholder for hydration', async () => {
    const html = await SSRRenderer.renderToHTML(options)
    expect(html).toContain('data-apexcharts-hydrate')
    expect(html).toContain('apexcharts-ssr-placeholder')
  })
})
