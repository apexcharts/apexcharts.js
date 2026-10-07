import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// dataLabels.formatter written against earlier releases reads the chart off
// `opts.ctx` (`opts.ctx.w`). It went missing when the modules stopped holding
// the chart, and such a formatter threw on the first label drawn.

describe('dataLabels.formatter gets the chart as opts.ctx', () => {
  for (const type of ['line', 'area', 'scatter', 'radar']) {
    it(`on a ${type} chart`, () => {
      const formatter = vi.fn((v, opts) => {
        const w = opts.ctx.w
        return `${w.config.series[opts.seriesIndex].name}:${v}`
      })
      const chart = createChartWithOptions({
        chart: { type, width: 500, height: 300 },
        series: [{ name: 'A', data: [30, 40, 35] }],
        ...(type === 'radar' ? { labels: ['a', 'b', 'c'] } : {}),
        dataLabels: { enabled: true, formatter },
      })

      expect(formatter).toHaveBeenCalled()
      for (const [, opts] of formatter.mock.calls) {
        expect(opts.ctx).toBe(chart)
        expect(opts.w).toBe(chart.w)
      }
      const texts = Array.from(
        chart.el.querySelectorAll('text.apexcharts-datalabel'),
      ).map((t) => t.textContent)
      expect(texts).toContain('A:40')
    })
  }

  it('on a bubble chart', () => {
    const formatter = vi.fn((v, opts) =>
      String(opts.ctx.w.globals.series.length),
    )
    const chart = createChartWithOptions({
      chart: { type: 'bubble', width: 500, height: 300 },
      series: [
        {
          name: 'A',
          data: [
            [1, 2, 10],
            [2, 3, 20],
          ],
        },
      ],
      dataLabels: { enabled: true, formatter },
    })
    expect(formatter).toHaveBeenCalled()
    expect(formatter.mock.calls[0][1].ctx).toBe(chart)
  })
})
