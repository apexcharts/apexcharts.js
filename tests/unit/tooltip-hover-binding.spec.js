import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// addSVGEvents is run by every render and data update: it read cx and cy off
// every mark into arrays no hover used.

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms))

const lineSeries = (n, len, k = 0) =>
  Array.from({ length: n }, (_, i) => ({
    name: `s${i}`,
    data: Array.from({ length: len }, (_, j) => ((i + 1) * (j + 3) + k) % 37),
  }))

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
  vi.restoreAllMocks()
})

describe('addSVGEvents reads nothing it drops', () => {
  it('reads no cx / cy off the marks', async () => {
    chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300 },
      series: lineSeries(3, 40),
    })
    await tick()
    const tt = chart.w.globals.tooltip
    const real = Element.prototype.getAttribute
    let reads = 0
    vi.spyOn(Element.prototype, 'getAttribute').mockImplementation(
      function (n) {
        if (n === 'cx' || n === 'cy') reads++
        return real.call(this, n)
      },
    )
    tt.addSVGEvents()
    expect(reads).toBe(0)
  })
})
