import { describe, it, expect, afterEach } from 'vitest'
// Sunburst is opt-in; importing its entry registers the type globally for the
// shared helper below.
import '../../src/entries/sunburst.js'
import { createChartWithOptions } from './utils/utils.js'

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
