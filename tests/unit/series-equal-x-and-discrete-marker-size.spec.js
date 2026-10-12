import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Exports from '../../src/modules/Exports'

// Two series that started at the same x were treated as sharing every x, so
// the shared tooltip and the CSV paired points by index: B's value at x=2.5
// landed on A's x=2 row, and a fast-path updateSeries reset the flag to true
// whatever the data. An empty series flipped the flag the other way. The
// keyed CSV rows also sorted string categories as text. Separately, a colour-only markers.discrete entry (no size) made
// the largest marker size NaN, collapsing the marker clip and hiding every
// marker.

const line = (series, extra = {}) =>
  createChartWithOptions({
    chart: { type: 'line', width: 600, height: 300, animations: { enabled: false } },
    series,
    xaxis: { type: 'numeric' },
    ...extra,
  })

const A = { name: 'A', data: [[1, 10], [2, 20], [3, 30]] }
const B = { name: 'B', data: [[1, 5], [2.5, 6], [3, 7]] }
const EQ = { name: 'B', data: [[1, 5], [2, 6], [3, 7]] }

const csvRows = (c) => {
  const spy = vi
    .spyOn(Exports.prototype, 'triggerDownload')
    .mockImplementation(() => {})
  new Exports(c.w, c.ctx).exportToCSV(c.w.config.series, 'f')
  const rows = decodeURIComponent(spy.mock.calls[0][0]).split('\n').slice(1)
  spy.mockRestore()
  return rows
}

describe('allSeriesHasEqualX', () => {
  it('is false when series share the first x but diverge later', () => {
    const c = line([A, B])
    expect(c.w.globals.allSeriesHasEqualX).toBe(false)
  })

  it('is false when a series misses a point in the middle', () => {
    const c = line([A, { name: 'B', data: [[1, 5], [3, 7]] }])
    expect(c.w.globals.allSeriesHasEqualX).toBe(false)
  })

  it('is true when every x matches', () => {
    const c = line([A, EQ])
    expect(c.w.globals.allSeriesHasEqualX).toBe(true)
  })

  it('ignores an empty series', () => {
    const c = line([
      { name: 'E', data: [] },
      A,
      EQ,
    ])
    expect(c.w.globals.allSeriesHasEqualX).toBe(true)
  })

  const keyed = ['1,10,5', '2,20,', '2.5,,6', '3,30,7']

  it('exports diverging series as one row per distinct x', () => {
    expect(csvRows(line([A, B]))).toEqual(keyed)
  })

  it('is recomputed by updateSeries with the same diverging data', async () => {
    const c = line([A, B])
    await c.updateSeries([A, B])
    expect(c.w.globals.allSeriesHasEqualX).toBe(false)
    expect(csvRows(c)).toEqual(keyed)
  })

  it('is recomputed by updateSeries from equal to diverging and back', async () => {
    const c = line([A, EQ])
    await c.updateSeries([A, B])
    expect(c.w.globals.allSeriesHasEqualX).toBe(false)
    expect(csvRows(c)).toEqual(keyed)
    await c.updateSeries([A, EQ])
    expect(c.w.globals.allSeriesHasEqualX).toBe(true)
  })

  it('keeps string categories in data order on the keyed CSV path', () => {
    const c = createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false } },
      series: [
        { name: 'A', data: [{ x: 'Jan', y: 1 }, { x: 'Mar', y: 3 }] },
        { name: 'B', data: [{ x: 'Jan', y: 4 }, { x: 'Feb', y: 5 }] },
      ],
    })
    expect(c.w.globals.allSeriesHasEqualX).toBe(false)
    expect(csvRows(c)).toEqual(['Jan,1,4', 'Mar,3,', 'Feb,,5'])
  })
})

describe('markers.discrete entry without size', () => {
  const chartWith = (discrete) =>
    line([{ name: 'S', data: [1, 2, 3] }], {
      xaxis: {},
      markers: { size: 4, discrete },
    })

  it('keeps the largest marker size and the marker clip intact', () => {
    const base = chartWith([]).w.globals.markers.largestSize
    const c = chartWith([{ seriesIndex: 0, dataPointIndex: 1, fillColor: '#e00' }])
    expect(c.w.globals.markers.largestSize).toBe(base)
    const r = document.querySelector('clipPath[id^="gridRectMarkerMask"] rect')
    expect(Number(r.getAttribute('width'))).toBeGreaterThan(0)
    expect(Number(r.getAttribute('height'))).toBeGreaterThan(0)
  })
})
