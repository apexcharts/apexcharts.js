/**
 * A category line or area chart is drawn on a numeric axis, and its names live
 * in the label formatter the conversion installs. Every parse converts again,
 * and each one used to wrap the formatter the previous one had installed: the
 * chain grew by one closure per render until it overflowed the stack.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const data = (k) => [
  {
    name: 'a',
    data: [
      { x: 'Jan', y: k },
      { x: 'Feb', y: 2 },
      { x: 'Mar', y: 3 },
    ],
  },
]

const userFormatter = (val) => val

describe('the converted category formatter', () => {
  it('wraps the same base formatter however many times the chart renders', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      xaxis: { labels: { formatter: userFormatter } },
      series: data(1),
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(true)
    for (let k = 0; k < 20; k++) await chart.updateSeries(data(k), false)

    // One wrapper between the axis and the user's formatter, not twenty.
    const fmt = chart.w.config.xaxis.labels.formatter
    expect(fmt.baseFormatter).toBe(userFormatter)
    expect(fmt(2)).toBe('Feb')
  })
})
