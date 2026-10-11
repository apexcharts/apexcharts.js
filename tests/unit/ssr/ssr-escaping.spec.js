import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import '../../../src/entries/standard.js'

// User labels containing <, & or " must not come out of SSR as live markup
// (an injection sink for renderToHTML) or as malformed XML. The browser path
// goes through textContent/setAttribute and renders them inertly.
describe('SSR output escapes user text', () => {
  let savedWindow, savedDocument, savedNavigator
  beforeEach(() => {
    savedWindow = global.window
    savedDocument = global.document
    savedNavigator = global.navigator
    global.window = undefined
    global.document = undefined
    global.navigator = undefined
    BrowserAPIs._resetShim()
  })
  afterEach(() => {
    global.window = savedWindow
    global.document = savedDocument
    global.navigator = savedNavigator
    BrowserAPIs._resetShim()
  })

  const opts = () => ({
    chart: { type: 'bar', width: 500, height: 300 },
    title: { text: 'R&D "x"' },
    series: [{ name: 's', data: [1, 2] }],
    xaxis: {
      categories: ['<img src=x onerror=alert(1)>', 'Tom & Jerry'],
    },
  })

  it('renderToHTML emits no raw tag from a category label', async () => {
    const html = await SSRRenderer.renderToHTML(opts())
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('renderToString escapes & in text', async () => {
    const svg = await SSRRenderer.renderToString(opts())
    expect(svg).not.toMatch(/Tom & Jerry/)
    expect(svg).toContain('Tom &amp; Jerry')
  })

  it('attribute values carry no bare & or "', async () => {
    const svg = await SSRRenderer.renderToString(opts())
    const attrVals = [...svg.matchAll(/\s[\w:-]+="([^"]*)"/g)].map((m) => m[1])
    for (const v of attrVals) expect(v).not.toMatch(/&(?![a-zA-Z]+;|#\d+;)/)
  })
})
