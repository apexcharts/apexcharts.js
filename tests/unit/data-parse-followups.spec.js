import { describe, it, expect, afterEach } from 'vitest'
// Sunburst is opt-in; importing its entry registers the type globally for the
// shared helper below.
import '../../src/entries/sunburst.js'
import { createChartWithOptions } from './utils/utils.js'
import Data from '../../src/modules/Data.js'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('sunburst root colour reaches the legend', () => {
  it('a root with its own colour paints its legend marker that colour', () => {
    const chart = createChartWithOptions({
      chart: { type: 'sunburst', width: 400, height: 400 },
      legend: { show: true },
      series: [
        {
          data: [
            { x: 'Tech', color: '#123456', children: [{ x: 'Software', y: 3 }] },
            { x: 'Energy', children: [{ x: 'Oil', y: 2 }] },
          ],
        },
      ],
    })
    const w = chart.w
    expect(w.globals.colors[0]).toBe('#123456')
    // The uncoloured root keeps its palette colour.
    expect(w.globals.colors[1]).not.toBe('#123456')
    const markers = chart.el.querySelectorAll(
      '.apexcharts-legend-marker.apexcharts-marker',
    )
    expect(markers.length).toBe(2)
    expect(markers[0].getAttribute('fill').toLowerCase()).toBe('#123456')
  })
})

describe('parsing applies to rows that also carry x or y', () => {
  const rows = () => [
    { x: 1, y: 5, value: 50 },
    { x: 2, y: 6, value: 60 },
  ]

  it('maps y to the named field instead of plotting the row y', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      parsing: { x: 'x', y: 'value' },
      series: [{ name: 'a', data: rows() }],
    })
    expect(chart.w.seriesData.series[0]).toEqual([50, 60])
  })

  it('keeps bubble sizes from a mapped z field', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bubble' },
      series: [
        {
          name: 'b',
          parsing: { x: 'x', y: 'y', z: 'size' },
          data: [
            { x: 1, y: 5, size: 30 },
            { x: 2, y: 6, size: 40 },
          ],
        },
      ],
    })
    expect(chart.w.seriesData.seriesZ[0]).toEqual([30, 40])
  })

  it('does not re-parse rows already parsed on appendData or updateSeries', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      parsing: { x: 'x', y: 'value' },
      series: [{ name: 'a', data: rows() }],
    })
    // config.series now holds the parsed {x, y} rows, so the appended row
    // comes in that shape too; mapping `value` over them would blank them.
    await chart.appendData([{ data: [{ x: 3, y: 70 }] }])
    expect(chart.w.seriesData.series[0]).toEqual([50, 60, 70])
    await chart.updateSeries(chart.w.config.series)
    expect(chart.w.seriesData.series[0]).toEqual([50, 60, 70])
  })

  it('leaves an identity map alone so extra row fields survive', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      parsing: { x: 'x', y: 'y' },
      series: [{ name: 'c', data: [{ x: 'A', y: 3, fillColor: '#ff0000' }] }],
    })
    expect(chart.w.config.series[0].data[0].fillColor).toBe('#ff0000')
  })
})

describe('dataReducer reads date and numeric-string points as numbers', () => {
  const DAY = 86400000
  const T0 = Date.UTC(2024, 0, 1)
  // Flat at 1 with one spike that is not the first point of its bucket.
  const series = (fmtX, fmtY) =>
    Array.from({ length: 200 }, (_, i) => ({
      x: fmtX(T0 + i * DAY),
      y: fmtY(i === 103 ? 100 : 1),
    }))
  const iso = (t) => new Date(t).toISOString()

  const reduced = (data) =>
    createChartWithOptions({
      chart: {
        type: 'line',
        width: 500,
        height: 300,
        dataReducer: { enabled: true, threshold: 50, targetPoints: 20 },
      },
      xaxis: { type: 'datetime' },
      series: [{ name: 'S', data }],
    })

  it('keeps a spike when x is an ISO string', () => {
    const chart = reduced(series(iso, (y) => y))
    expect(chart.w.seriesData.series[0].length).toBe(20)
    expect(Math.max(...chart.w.seriesData.series[0])).toBe(100)
    expect(chart.w.globals.dataReducerRawMinX).toBe(T0)
  })

  it('keeps a spike when x is a Date and y a numeric string', () => {
    const chart = reduced(series((t) => new Date(t), String))
    expect(Math.max(...chart.w.seriesData.series[0])).toBe(100)
  })

  it('slices a zoom window over ISO-string x', () => {
    const data = series(iso, (y) => y)
    const win = Data.sliceByXRange(data, T0 + 50 * DAY, T0 + 60 * DAY)
    expect(win.length).toBeLessThan(15)
    expect(win[1].x).toBe(iso(T0 + 50 * DAY))
  })
})
