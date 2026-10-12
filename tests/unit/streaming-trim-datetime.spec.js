import { describe, it, expect } from 'vitest'
import { trimStreamingSeries } from '../../src/modules/animations/StreamScroll.js'

// chart.streaming bounds memory to the xaxis.range window. The trim read only
// numeric x, so a stream of ISO strings or Dates grew without limit.
const MIN = 60000

function w(type = 'datetime') {
  return {
    config: {
      chart: { streaming: { enabled: true } },
      xaxis: { type, range: 5 * MIN },
    },
  }
}

function stream(toX, n = 60) {
  const t0 = Date.UTC(2026, 0, 1)
  return Array.from({ length: n }, (_, i) => ({ x: toX(t0 + i * MIN), y: i }))
}

describe('trimStreamingSeries with datetime x', () => {
  it('trims numeric timestamps to the range window', () => {
    const series = [{ data: stream((t) => t) }]
    trimStreamingSeries(series, w())
    expect(series[0].data.length).toBe(8)
  })

  it('trims ISO date strings the same way', () => {
    const series = [{ data: stream((t) => new Date(t).toISOString()) }]
    trimStreamingSeries(series, w())
    expect(series[0].data.length).toBe(8)
  })

  it('trims Date objects and [x, y] pairs the same way', () => {
    const series = [
      { data: stream((t) => new Date(t)) },
      { data: stream((t) => new Date(t).toISOString()).map((p) => [p.x, p.y]) },
    ]
    trimStreamingSeries(series, w())
    expect(series[0].data.length).toBe(8)
    expect(series[1].data.length).toBe(8)
  })

  it('leaves a category axis of strings alone', () => {
    const series = [{ data: stream((t) => `t${t}`) }]
    trimStreamingSeries(series, w('category'))
    expect(series[0].data.length).toBe(60)
  })
})
