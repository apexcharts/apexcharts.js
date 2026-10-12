import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import '../../../src/entries/standard.js'

// The legend is an HTML element beside the SVG (#5168). renderToHTML emits it
// with its stylesheet, on a box sized to the chart, and lays the plot out
// around it as the browser will. renderToString's standalone SVG has no legend
// and keeps the whole chart for the plot.
describe('SSR legend', () => {
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

  const size = { width: 400, height: 300 }
  const line = (extra = {}) => ({
    chart: { type: 'line', ...extra.chart },
    series: [
      { name: 'Revenue', data: [1, 2, 3] },
      { name: 'Cost', data: [3, 1, 2] },
    ],
    ...extra,
  })

  // Height of the plot's clip rect: the room left after the legend's.
  const plotHeight = (markup) =>
    parseFloat(
      /<clipPath id="gridRectMask[^"]*"><rect [^>]*\sheight="([\d.]+)"/.exec(
        markup,
      )[1],
    )

  const legendOf = (html) =>
    /<div class="apexcharts-legend[^"]*"[^>]*>/.exec(html)?.[0]

  it('emits the legend, its items and its stylesheet beside the SVG', async () => {
    const html = await SSRRenderer.renderToHTML(line(), size)

    expect(html).toContain(
      '<div style="position:relative;width:400px;height:300px"><svg',
    )
    const wrap = legendOf(html)
    expect(wrap).toContain('apx-legend-position-bottom')
    expect(wrap).toMatch(/position:absolute/)
    expect(wrap).toMatch(/top:\d+px/)
    expect(html.match(/class="apexcharts-legend-series"/g)).toHaveLength(2)
    expect(html).toContain('>Revenue</span>')
    expect(html).toMatch(
      /class="apexcharts-legend-text" style="color:[^"]*font-size:12px/,
    )
    // Marker shapes are drawn about 0,0 and centred in their box by a style.
    expect(html).toMatch(
      /apexcharts-marker-circle" style="transform:translate\(50%, 50%\)"/,
    )
    // vitest stands a mock in for the CSS import; the build inlines the text.
    expect(html).toMatch(/<style>[^<]+<\/style><div class="apexcharts-legend /)
  })

  it('leaves the legend room in HTML, and the whole chart to a bare SVG', async () => {
    const html = await SSRRenderer.renderToHTML(line(), size)
    const svg = await SSRRenderer.renderToString(line(), size)
    const noLegend = await SSRRenderer.renderToString(
      line({ legend: { show: false } }),
      size,
    )

    expect(svg).not.toContain('apexcharts-legend-series')
    expect(plotHeight(svg)).toBe(plotHeight(noLegend))
    // A bottom row of 12px items with 4px vertical margins.
    expect(plotHeight(svg) - plotHeight(html)).toBeGreaterThan(15)
    expect(plotHeight(svg) - plotHeight(html)).toBeLessThan(40)
  })

  it('narrows the plot for a side legend by its widest item', async () => {
    const opts = (name) =>
      line({
        legend: { position: 'right' },
        series: [
          { name, data: [1, 2, 3] },
          { name: 'B', data: [3, 1, 2] },
        ],
      })
    const width = (markup) =>
      parseFloat(
        /<clipPath id="gridRectMask[^"]*"><rect [^>]*?\swidth="([\d.]+)"/.exec(
          markup,
        )[1],
      )

    const short = await SSRRenderer.renderToHTML(opts('A'), size)
    const long = await SSRRenderer.renderToHTML(
      opts('A much longer name'),
      size,
    )
    expect(legendOf(short)).toContain('apx-legend-position-right')
    expect(width(short) - width(long)).toBeGreaterThan(50)
  })

  it('wraps a long bottom legend onto more rows', async () => {
    const series = (n) =>
      Array.from({ length: n }, (_, i) => ({
        name: 'Series number ' + i,
        data: [1, 2, 3],
      }))
    const two = await SSRRenderer.renderToHTML(
      line({ series: series(2) }),
      size,
    )
    const ten = await SSRRenderer.renderToHTML(
      line({ series: series(10) }),
      size,
    )
    expect(plotHeight(two) - plotHeight(ten)).toBeGreaterThan(30)
  })

  it('emits nothing for a chart without a legend', async () => {
    const html = await SSRRenderer.renderToHTML(
      { chart: { type: 'line' }, series: [{ name: 'Only', data: [1, 2, 3] }] },
      size,
    )
    expect(html).not.toContain('apexcharts-legend')
    expect(html).not.toContain('<style')
    expect(html).not.toContain('position:relative')
  })

  it('carries the nonce, and leaves the stylesheet to the page when asked', async () => {
    const withNonce = await SSRRenderer.renderToHTML(
      line({ chart: { type: 'line', nonce: 'abc"1' } }),
      size,
    )
    expect(withNonce).toContain('<style nonce="abc&quot;1">')

    const noSheet = await SSRRenderer.renderToHTML(
      line({ chart: { type: 'line', injectStyleSheet: false } }),
      size,
    )
    expect(noSheet).not.toContain('<style')
    expect(legendOf(noSheet)).toBeTruthy()
  })
})
