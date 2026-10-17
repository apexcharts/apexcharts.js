import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import '../../src/entries/standard.js'

// The browser coerces a text value to a string, so a numeric 0 reads "0".
describe('SSR keeps a numeric 0 text', () => {
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

  const dataLabels = (svg) => [
    ...svg.matchAll(
      /<text[^>]*apexcharts-datalabel[^>]*?(\/>|>([\s\S]*?)<\/text>)/g,
    ),
  ]

  it('a 0-valued bar data label serializes with its text', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'bar', width: 500, height: 300 },
      dataLabels: { enabled: true },
      series: [{ data: [0, 5] }],
    })
    const labels = dataLabels(svg)
    expect(labels.length).toBe(2)
    for (const m of labels) expect(m[1]).not.toBe('/>')
    expect(svg).toMatch(/>0</)
  })

  it('a 0-valued line data label keeps its text', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line', width: 500, height: 300 },
      dataLabels: { enabled: true },
      series: [{ data: [0, 5, 0] }],
    })
    const labels = dataLabels(svg)
    expect(labels.length).toBe(3)
    for (const m of labels) expect(m[1]).not.toBe('/>')
  })

  it('a title of 0 renders "0"', async () => {
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'line', width: 500, height: 300 },
      title: { text: 0 },
      series: [{ data: [1, 2] }],
    })
    expect(svg).toMatch(/<text[^>]*apexcharts-title-text[^>]*>0<\/text>/)
  })
})
