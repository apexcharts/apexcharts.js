import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * `markers.discrete` restyles individual points. An entry declares the fields it
 * wants changed; the ones it leaves out must keep the series defaults rather
 * than being blanked, which is what made a `{ seriesIndex, dataPointIndex, size }`
 * entry (resize this one point, keep its colours) render with no fill.
 */

const chartWith = (discrete, extra = {}) =>
  createChartWithOptions({
    // jsdom has no layout, so the chart needs explicit dimensions or the plot
    // collapses and no marks are drawn.
    chart: { type: 'line', width: 600, height: 400, animations: { enabled: false } },
    colors: ['#008FFB'],
    markers: { size: 0, discrete, ...extra },
    series: [{ name: 'S', data: [10, 40, 25, 50] }],
  })

const markerAt = (j) =>
  document.querySelector(`.apexcharts-series .apexcharts-marker[j="${j}"]`)

describe('markers.discrete', () => {
  it('draws a discrete marker even when the series markers are off', () => {
    chartWith([{ seriesIndex: 0, dataPointIndex: 1, size: 7 }])
    const el = markerAt(1)
    expect(el).toBeTruthy()
    expect(Number(el.getAttribute('default-marker-size'))).toBe(7)
  })

  it('leaves the other points at size 0', () => {
    chartWith([{ seriesIndex: 0, dataPointIndex: 1, size: 7 }])
    expect(Number(markerAt(2).getAttribute('default-marker-size'))).toBe(0)
  })

  it('keeps the series colour when the entry declares no fillColor', () => {
    chartWith([{ seriesIndex: 0, dataPointIndex: 1, size: 7 }])
    expect(markerAt(1).getAttribute('fill')).toBe('#008FFB')
  })

  it('still applies the colours an entry does declare', () => {
    chartWith([
      {
        seriesIndex: 0,
        dataPointIndex: 1,
        size: 7,
        fillColor: '#FF4560',
        strokeColor: '#333',
      },
    ])
    const el = markerAt(1)
    expect(el.getAttribute('fill')).toBe('#FF4560')
    expect(el.getAttribute('stroke')).toBe('#333')
  })

  it('applies only to the point it names', () => {
    chartWith([{ seriesIndex: 0, dataPointIndex: 1, size: 7, fillColor: '#FF4560' }])
    expect(markerAt(1).getAttribute('fill')).toBe('#FF4560')
    expect(markerAt(2).getAttribute('fill')).toBe('#008FFB')
  })
})
