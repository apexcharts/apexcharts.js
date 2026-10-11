import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A null point inside a candlestick/boxPlot series must hold its slot in the
// OHLC arrays so every later candle/box is drawn (and ranged) at its own
// values.

const T0 = Date.UTC(2026, 0, 1)
const DAY = 864e5

describe('candlestick/boxPlot null gap keeps OHLC index alignment', () => {
  it('candlestick: arrays stay positional and y-range covers post-gap candles', () => {
    const data = [
      { x: T0, y: [10, 12, 9, 11] },
      { x: T0 + DAY, y: null },
      { x: T0 + 2 * DAY, y: [20, 22, 19, 21] },
      { x: T0 + 3 * DAY, y: [30, 32, 29, 31] },
    ]
    const chart = createChartWithOptions({
      chart: { type: 'candlestick', width: 600, height: 400, animations: { enabled: false } },
      xaxis: { type: 'datetime' },
      series: [{ data }],
    })
    const w = chart.w
    expect(w.candleData.seriesCandleO[0].length).toBe(data.length)
    // candle j=2 must read its own open, not candle j=3's
    expect(w.candleData.seriesCandleO[0][2]).toBe(20)
    expect(w.candleData.seriesCandleH[0][3]).toBe(32)
    expect(w.globals.maxY).toBeGreaterThanOrEqual(32)
    // the gap draws nothing, and nothing draws at NaN
    expect(chart.el.innerHTML).not.toContain('NaN')
  })

  it('boxPlot: arrays stay positional with a mid-series null', () => {
    const data = [
      { x: 'a', y: [50, 60, 70, 80, 90] },
      { x: 'b', y: null },
      { x: 'c', y: [55, 65, 75, 85, 95] },
    ]
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot', width: 600, height: 400, animations: { enabled: false } },
      series: [{ data }],
    })
    const w = chart.w
    expect(w.candleData.seriesCandleO[0].length).toBe(data.length)
    expect(w.candleData.seriesCandleC[0][2]).toBe(95)
  })
})
