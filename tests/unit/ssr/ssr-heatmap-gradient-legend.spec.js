import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import '../../../src/entries/standard.js'

// The gradient legend repaints its stops once the y extent is known. In a
// server render, clearing them through textContent left the old stops in
// place, so the markup carried two sets and showed the stale shade.
describe('heatmap gradient legend in SSR', () => {
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

  it('renders one set of stops, ending at the max cell colour', async () => {
    const html = await SSRRenderer.renderToHTML(
      {
        chart: { type: 'heatmap' },
        colors: ['#008FFB'],
        series: [{ name: 'r', data: [13, 40, 98].map((y, i) => ({ x: `c${i}`, y })) }],
        legend: { show: true },
        plotOptions: { heatmap: { colorScale: { gradientLegend: { enabled: true } } } },
        dataLabels: { enabled: false },
      },
      { width: 600, height: 320 },
    )
    const grad = html
      .match(/<linearGradient[^>]*>(?:(?!<\/linearGradient>)[\s\S])*?<\/linearGradient>/g)
      .find((g) => g.includes('<stop'))
    const stops = grad.match(/<stop[^>]*>/g)
    expect(stops).toHaveLength(16)
    expect(stops[0]).toContain('offset="0.00%"')
    expect(stops[15]).toContain('offset="100.00%"')
    // the 98 cell is rgb(5,145,251); the stale pre-repaint end was #1e9cfb
    expect(stops[15]).toContain('stop-color="#0591fb"')
  })
})
