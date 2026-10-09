import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Without `import 'apexcharts/features/highlight-filter'` a chart handed parts
// draws as it always did and says once what is missing, on the update path too
// (the Filter-By flow mounts with no pick and sends the part later).

afterEach(() => vi.restoreAllMocks())

const missing = (warn) =>
  warn.mock.calls.filter((c) => String(c[0]).includes('features/highlight-filter'))

describe('highlight filter not loaded', () => {
  test('parts are ignored with one warning naming the import', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300 },
      series: [{ name: 'A', data: [10, 20], highlightData: [5, 5] }],
    })
    expect(chart.highlightFilter).toBe(null)
    expect(chart.w.highlightData).toBe(null)
    expect(chart.el.querySelectorAll('.apexcharts-highlight-part').length).toBe(0)
    expect(missing(warn).length).toBe(1)
  })

  test('a pie handed highlightFilter.data draws plain and warns once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'donut', width: 400, height: 400 },
      series: [40, 30],
      labels: ['A', 'B'],
    })
    expect(missing(warn).length).toBe(0)
    await chart.updateOptions({ highlightFilter: { data: [10, 20] } })
    await chart.updateOptions({ title: { text: 'again' } })
    expect(missing(warn).length).toBe(1)
    expect(chart.el.querySelectorAll('.apexcharts-highlight-part').length).toBe(0)
  })

  test('a treemap handed parts on its leaves draws plain and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'treemap', width: 500, height: 300 },
      series: [
        {
          name: 'S',
          data: [{ x: 'G', children: [{ x: 'a', y: 10, highlight: 4 }, { x: 'b', y: 20 }] }],
        },
      ],
    })
    expect(missing(warn).length).toBe(1)
    const fills = [...chart.el.querySelectorAll('.apexcharts-treemap-rect')].map((n) => n.getAttribute('fill'))
    expect(fills.length).toBe(2)
    expect(fills.some((f) => /url/.test(f))).toBe(false)
    expect(chart.el.querySelectorAll('.apexcharts-highlight-tile').length).toBe(0)
  })

  test('a part that first arrives through updateSeries still warns', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300 },
      series: [{ name: 'A', data: [10, 20] }],
    })
    expect(missing(warn).length).toBe(0)
    await chart.updateSeries([{ name: 'A', data: [{ x: 'a', y: 10, highlight: 4 }, { x: 'b', y: 20 }] }])
    expect(missing(warn).length).toBe(1)
  })
})
