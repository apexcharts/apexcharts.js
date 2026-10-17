import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { streamgraphTransform } from '../../src/features/streamgraph'
import { xKey } from '../../src/modules/helpers/XKey.js'

// On a datetime axis, ISO date strings have an order: ragged series must give
// columns sorted by time, or the bands fold back over themselves and the
// wiggle baseline is solved on periods that are not neighbours.

const fakeW = (xaxis = {}) => ({
  config: { xaxis, plotOptions: {} },
  globals: { collapsedSeriesIndices: [] },
})

describe('streamgraph sorts datetime-string columns', () => {
  it('a date only one series has lands between its neighbours', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'streamgraph',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'A',
          data: [
            { x: '2024-01-01', y: 4 },
            { x: '2024-03-01', y: 6 },
          ],
        },
        {
          name: 'B',
          data: [
            { x: '2024-01-01', y: 2 },
            { x: '2024-02-01', y: 5 },
            { x: '2024-03-01', y: 3 },
          ],
        },
      ],
    })
    const xs = chart.w.seriesData.seriesX[0]
    expect(xs.length).toBe(3)
    expect([...xs].sort((a, b) => a - b)).toEqual(xs)
    chart.destroy()
  })

  it('a string and the matching timestamp join into one column', () => {
    const t = Date.parse('2024-02-01')
    const w = fakeW({ type: 'datetime' })
    streamgraphTransform(
      [
        {
          name: 'A',
          data: [
            { x: '2024-03-01', y: 1 },
            { x: t, y: 2 },
          ],
        },
        { name: 'B', data: [{ x: '2024-02-01', y: 3 }] },
      ],
      w,
    )
    const d = w.streamgraphData
    expect(d.xs.length).toBe(2)
    expect(d.xs.map((x) => xKey(x, true))).toEqual([
      t,
      Date.parse('2024-03-01'),
    ])
    // Both series contribute to the February column.
    expect(d.values[0][0]).toBe(2)
    expect(d.values[1][0]).toBe(3)
  })

  it('category strings keep first-seen order off a datetime axis', () => {
    const w = fakeW()
    streamgraphTransform(
      [
        {
          name: 'A',
          data: [
            { x: 'Mar', y: 1 },
            { x: 'Jan', y: 2 },
          ],
        },
        { name: 'B', data: [{ x: 'Feb', y: 3 }] },
      ],
      w,
    )
    expect(w.streamgraphData.xs).toEqual(['Mar', 'Jan', 'Feb'])
  })
})

describe('xKey', () => {
  it('keys dates by epoch and leaves everything else alone', () => {
    const d = new Date('2024-01-01T00:00:00Z')
    expect(xKey(d, false)).toBe(d.getTime())
    expect(xKey('2024-01-01', true)).toBe(Date.parse('2024-01-01'))
    expect(xKey('2024-01-01', false)).toBe('2024-01-01')
    expect(xKey('not a date', true)).toBe('not a date')
    expect(xKey(5, true)).toBe(5)
  })
})
