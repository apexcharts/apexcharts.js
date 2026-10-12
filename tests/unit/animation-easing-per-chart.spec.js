import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartsWithOptions } from './utils/utils.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

// chart.animations.easing used to be one page-wide default: the last chart
// rendered decided the curve of every chart's tweens.
function lineChart(easing) {
  return {
    chart: { type: 'line', animations: { enabled: true, easing } },
    series: [{ data: [1, 2, 3] }],
  }
}

// Start a 100 ms tween of `x` from 0 to 100 on a rect in `chart`'s paper and
// return its value a quarter of the way through.
async function quarterWay(chart) {
  const frames = []
  vi.spyOn(BrowserAPIs, 'requestAnimationFrame').mockImplementation((cb) => {
    frames.push(cb)
    return frames.length
  })
  vi.spyOn(performance, 'now').mockReturnValue(1000)
  const rect = chart.w.dom.Paper.rect(10, 10).attr({ x: 0 })
  rect.animate(100, 0).attr({ x: 100 })
  await Promise.resolve()
  await Promise.resolve()
  frames.shift()(1025)
  vi.restoreAllMocks()
  return parseFloat(rect.attr('x'))
}

describe('per-chart animation easing', () => {
  afterEach(() => vi.restoreAllMocks())

  it('tweens each chart on its own easing', async () => {
    const [linear, sine] = createChartsWithOptions(
      lineChart('linear'),
      lineChart('easeInOutSine'),
    )
    // `sine` rendered last; `linear` must still ease linearly.
    expect(await quarterWay(linear)).toBeCloseTo(25, 5)
    expect(await quarterWay(sine)).toBeCloseTo(14.645, 2)
  })
})
