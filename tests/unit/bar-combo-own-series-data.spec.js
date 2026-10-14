import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/entries/violin.js'

// In a combo chart a column or candle series drawn after a line read its
// per-datum strokeColor, fill, `val` and label sign from the series at its
// position among the bars, not its own: styling landed on the next column
// series, and a negative line moved the column's labels. A line's x values
// also narrowed every column slot on a datetime axis.

const D = (m, d) => Date.UTC(2024, m, d)
const bars = (name, type = 'bar') =>
  document.querySelectorAll(
    `.apexcharts-series[seriesName="${name}"] .apexcharts-${type}-area`,
  )

const combo = (c1Datum) =>
  createChartWithOptions({
    chart: { type: 'line', width: 600, height: 400 },
    dataLabels: { enabled: false },
    xaxis: { categories: ['a', 'b'] },
    series: [
      { name: 'L', type: 'line', data: [100, 200] },
      {
        name: 'C1',
        type: 'column',
        data: [
          { x: 'a', y: 10, ...c1Datum },
          { x: 'b', y: 20 },
        ],
      },
      { name: 'C2', type: 'column', data: [30, 40] },
    ],
  })

describe('combo columns read their own series', () => {
  it('per-datum strokeColor and val stay on the column that set them', () => {
    combo({ strokeColor: '#ff0000' })
    expect(bars('C1')[0].getAttribute('stroke')).toBe('#ff0000')
    expect(bars('C2')[0].getAttribute('stroke')).not.toBe('#ff0000')
    expect(Number(bars('C1')[0].getAttribute('val'))).toBe(10)
    expect(Number(bars('C2')[1].getAttribute('val'))).toBe(40)
  })

  it('per-datum fill stays on the column that set it', () => {
    combo({ fill: { type: 'pattern', pattern: { style: 'verticalLines' } } })
    expect(bars('C1')[0].getAttribute('fill')).toMatch(/^url\(/)
    expect(bars('C2')[0].getAttribute('fill')).not.toMatch(/^url\(/)
  })

  it('a candle after a line carries its own val and strokeColor', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      dataLabels: { enabled: false },
      xaxis: { type: 'datetime' },
      series: [
        {
          name: 'L',
          type: 'line',
          data: [
            { x: D(0, 1), y: 1000 },
            { x: D(0, 2), y: 2000 },
          ],
        },
        {
          name: 'K',
          type: 'candlestick',
          data: [
            { x: D(0, 1), y: [10, 20, 5, 15] },
            { x: D(0, 2), y: [15, 25, 10, 20], strokeColor: '#ff0000' },
          ],
        },
      ],
    })
    const k = bars('K', 'candlestick')
    expect(Number(k[0].getAttribute('val'))).toBe(
      chart.w.seriesData.series[1][0],
    )
    expect(k[k.length - 1].getAttribute('stroke')).toBe('#ff0000')
  })

  it('a negative line does not move the column labels', () => {
    const labelYs = (lineVal) => {
      createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        yaxis: { min: -100, max: 100 },
        plotOptions: { bar: { dataLabels: { position: 'center' } } },
        dataLabels: { enabled: true, enabledOnSeries: [1] },
        xaxis: { categories: ['a', 'b'] },
        series: [
          { name: 'L', type: 'line', data: [lineVal, lineVal] },
          { name: 'C', type: 'column', data: [40, 60] },
        ],
      })
      return [...document.querySelectorAll('.apexcharts-datalabel')].map((t) =>
        Number(t.getAttribute('y')),
      )
    }
    const pos = labelYs(50)
    expect(pos.length).toBe(2)
    expect(labelYs(-50)).toEqual(pos)
  })

  it('a line with offset dates does not narrow the columns', () => {
    const share = (withLine) => {
      const series = [
        {
          name: 'cols',
          type: 'column',
          data: Array.from({ length: 6 }, (_, m) => [D(m, 1), 10 + m]),
        },
      ]
      if (withLine) {
        series.push({
          name: 'line',
          type: 'line',
          data: Array.from({ length: 6 }, (_, m) => [D(m, 15), 12]),
        })
      }
      const { w } = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        dataLabels: { enabled: false },
        xaxis: {
          type: 'datetime',
          min: D(0, 1) - 20 * 864e5,
          max: D(5, 1) + 20 * 864e5,
        },
        series,
      })
      // the grid width moves with the legend, so compare the share of it
      return w.globals.barWidth / w.layout.gridWidth
    }
    expect(share(true)).toBeCloseTo(share(false), 5)
  })

  it('a line with offset dates does not narrow the violins', () => {
    const density = [
      [0, 0.1],
      [2, 0.5],
      [4, 0.1],
    ]
    const share = (withLine) => {
      const series = [
        {
          name: 'v',
          type: 'violin',
          data: Array.from({ length: 6 }, (_, m) => ({
            x: D(m, 1),
            y: { density, points: [1, 2, 3] },
          })),
        },
      ]
      if (withLine) {
        series.push({
          name: 'line',
          type: 'line',
          data: Array.from({ length: 6 }, (_, m) => [D(m, 15), 2]),
        })
      }
      const { w } = createChartWithOptions({
        chart: { type: 'line', width: 600, height: 400 },
        dataLabels: { enabled: false },
        xaxis: {
          type: 'datetime',
          min: D(0, 1) - 20 * 864e5,
          max: D(5, 1) + 20 * 864e5,
        },
        series,
      })
      const v = (
        document
          .querySelector('.apexcharts-violin-area')
          .getAttribute('d')
          .match(/[ML]\s*-?[\d.]+/g) || []
      ).map((s) => Number(s.replace(/[ML]\s*/, '')))
      return (Math.max(...v) - Math.min(...v)) / w.layout.gridWidth
    }
    expect(share(true)).toBeCloseTo(share(false), 3)
  })
})
