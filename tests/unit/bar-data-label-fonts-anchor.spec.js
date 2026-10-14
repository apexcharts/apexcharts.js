import { describe, it, expect, vi, afterEach } from 'vitest'
import Graphics from '../../src/modules/Graphics'
import { createChartWithOptions } from './utils/utils.js'

// Bar data label defects users saw:
// - with plotOptions.bar.dataLabels.orientation 'vertical', the per-label
//   anchor was written into the shared dataLabels config, so line labels in a
//   combo and every later render inherited start/end anchoring;
// - large stacked total labels were measured as 11px text, so a big total
//   overlapped a negative stack;
// - bold rangeBar labels were measured at regular weight, so labels that
//   overflowed their bar were kept.

afterEach(() => vi.restoreAllMocks())

// jsdom has no layout: size text from its font so measurement matters
const sizedText = () => {
  const orig = Graphics.prototype.getTextRects
  return vi
    .spyOn(Graphics.prototype, 'getTextRects')
    .mockImplementation(function (text, fontSize, ff, tr, bb, fontWeight) {
      orig.call(this, text, fontSize, ff, tr, bb, fontWeight)
      const px = parseFloat(fontSize) || 11
      const bold = Number(fontWeight) >= 600
      return {
        width: String(text).length * px * (bold ? 0.7 : 0.5),
        height: px * 1.25,
      }
    })
}

describe('bar data labels', () => {
  it('vertical labels leave the configured textAnchor alone', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 600, height: 400 },
      plotOptions: {
        bar: { dataLabels: { orientation: 'vertical', position: 'top' } },
      },
      dataLabels: { enabled: true },
      series: [{ name: 'A', data: [10, 20, 30] }],
    })
    expect(chart.w.config.dataLabels.textAnchor).toBe('middle')
    expect(
      [...document.querySelectorAll('.apexcharts-datalabel')].map((t) =>
        t.getAttribute('text-anchor'),
      ),
    ).toEqual(['start', 'start', 'start'])
  })

  it('a large total clears the end of a negative stack', () => {
    sizedText()
    createChartWithOptions({
      chart: { type: 'bar', stacked: true, width: 600, height: 400 },
      plotOptions: {
        bar: {
          dataLabels: { total: { enabled: true, style: { fontSize: '36px' } } },
        },
      },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      xaxis: { categories: ['a'] },
      series: [
        { name: 'A', data: [-10] },
        { name: 'B', data: [-20] },
      ],
    })
    const ys = [
      ...document.querySelectorAll(
        '.apexcharts-series[seriesName="B"] .apexcharts-bar-area',
      ),
    ]
      .flatMap((p) => p.getAttribute('d').match(/-?[\d.]+/g).map(Number))
      .filter((_, k) => k % 2 === 1)
    const stackEnd = Math.max(...ys)
    const total = document.querySelector('.apexcharts-datalabel-total')
    const baseline = Number(total.getAttribute('y'))
    // the text's ascent (about three quarters of the font size) stays below
    expect(baseline - 36 * 0.75).toBeGreaterThanOrEqual(stackEnd)
  })

  it('the rangeBar overflow check measures in the drawn weight', () => {
    const spy = sizedText()
    createChartWithOptions({
      chart: { type: 'rangeBar', width: 600, height: 300 },
      plotOptions: {
        bar: { horizontal: true, dataLabels: { hideOverflowingLabels: true } },
      },
      dataLabels: {
        enabled: true,
        formatter: (v) => `LABEL-${v[0]}`,
        style: { fontSize: '40px', fontWeight: 700 },
      },
      xaxis: { min: 0, max: 100 },
      series: [{ name: 'A', data: [{ x: 'r1', y: [0, 30] }] }],
    })
    // 7 chars at 40px: 140px regular, 196px bold; the bar is ~170px long
    const bar = document.querySelector('.apexcharts-rangebar-area')
    const xs = bar
      .getAttribute('d')
      .match(/-?[\d.]+/g)
      .map(Number)
      .filter((_, k) => k % 2 === 0)
    const len = Math.max(...xs) - Math.min(...xs)
    expect(len).toBeGreaterThan(140)
    expect(len).toBeLessThan(196)
    expect(spy).toHaveBeenCalled()
    const label = document.querySelector('.apexcharts-datalabel')
    expect(label ? label.textContent : '').toBe('')
  })
})
