import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import '../../../src/entries/standard.js'

// With the legend hidden or floating, the centred square of a pie used to be
// capped by the wrapper's measured width, which the DOM shim reports as 0:
// the pie was drawn with a negative radius. The chart width is already known.
describe('SSR circle charts without a docked legend', () => {
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

  const radiusOf = (svg) => {
    // First slice: "M x y A r r ..."
    const m = svg.match(
      /apexcharts-pie-area[^>]*\sd="M\s*[-\d.e]+\s+[-\d.e]+\s+A\s*([-\d.e]+)/,
    )
    return m ? parseFloat(m[1]) : NaN
  }

  for (const legend of [{ show: false }, { floating: true }]) {
    it(`draws a pie with a positive radius, legend ${JSON.stringify(legend)}`, async () => {
      const svg = await SSRRenderer.renderToString({
        chart: {
          type: 'pie',
          width: 400,
          height: 300,
          animations: { enabled: false },
        },
        series: [10, 20, 30],
        legend,
      })
      expect(radiusOf(svg)).toBeGreaterThan(100)
    })
  }
})
