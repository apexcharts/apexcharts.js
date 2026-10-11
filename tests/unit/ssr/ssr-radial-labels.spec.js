import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
import '../../../src/entries/standard.js'

// A default radialBar or gauge (dataLabels.show defaults to true) must
// server-render with its centre name/value text. The labels group used to be
// looked up with Paper.findOne, which the DOM shim answers with null, so the
// whole render rejected.
describe('radialBar centre labels in SSR', () => {
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

  it('renders a default radialBar with its centre labels', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'radialBar', width: 400, height: 400 },
      series: [70],
      labels: ['Done'],
    })
    expect(svg).toContain('apexcharts-radialbar')
    expect(svg).toMatch(/>Done<\/text>/)
    expect(svg).toMatch(/>70%<\/text>/)
  })

  it('renders a default gauge', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [70],
    })
    expect(svg).toContain('apexcharts-datalabels-group')
  })

  it('still renders with dataLabels.show:false (control)', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'radialBar', width: 400, height: 400 },
      series: [70],
      plotOptions: { radialBar: { dataLabels: { show: false } } },
    })
    expect(svg).toContain('apexcharts-radialbar')
  })
})
