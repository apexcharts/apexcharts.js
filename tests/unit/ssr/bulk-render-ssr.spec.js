/**
 * SSR safety for the large-dataset bulk render.
 *
 * Above chart.animations.largeDatasetThreshold the renderer skips the per-path
 * morph and reveals the series via Animations.revealBulk, which hides each path
 * (apexcharts-element-hidden, opacity:0) then schedules a single rAF to reveal
 * it. There is no rAF in Node, so revealBulk takes its !isBrowser() branch and
 * reveals synchronously — otherwise the serialized SVG would freeze every candle
 * at opacity 0. This test simulates a true Node environment (no window/document/
 * navigator) and asserts the output renders and isn't stuck hidden.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SSRRenderer } from '../../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../../src/ssr/BrowserAPIs.js'
// Register all chart types as side-effects — SSRRenderer imports the bare
// ApexCharts class, so candlestick must be pre-registered here.
import '../../../src/entries/full.js'

describe('SSR bulk-render (large candlestick) does not throw or freeze at opacity 0', () => {
  let savedWindow, savedDocument, savedNavigator
  beforeEach(() => {
    savedWindow = global.window; savedDocument = global.document; savedNavigator = global.navigator
    global.window = undefined; global.document = undefined; global.navigator = undefined
    BrowserAPIs._resetShim()
  })
  afterEach(() => {
    global.window = savedWindow; global.document = savedDocument; global.navigator = savedNavigator
    BrowserAPIs._resetShim()
  })

  it('renders 1500 candles, reveals (no leftover element-hidden)', async () => {
    const base = new Date(2015, 0, 1).getTime()
    const data = []
    for (let i = 0; i < 1500; i++) {
      const o = 100 + Math.sin(i) * 5
      data.push({ x: base + i * 86400000, y: [o, o + 3, o - 3, o + 1] })
    }
    const svg = await SSRRenderer.renderToString({
      chart: { type: 'candlestick', width: 800, height: 350 },
      xaxis: { type: 'datetime' },
      series: [{ data }],
    })
    expect(typeof svg).toBe('string')
    expect(svg).toContain('<svg')
    expect(svg).toContain('apexcharts-candlestick-area')
    // Reveal must have completed: the shown class replaces element-hidden, so no
    // candle path should still carry apexcharts-element-hidden (opacity:0).
    expect(svg).not.toMatch(/candlestick-area[^>]*apexcharts-element-hidden/)
  })
})
