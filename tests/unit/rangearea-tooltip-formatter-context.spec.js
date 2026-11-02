// Range tooltips build their own HTML. tooltip.y.formatter was called with
// the value alone, so the context (seriesIndex, dataPointIndex, …) was
// undefined on a rangeArea hover (#4951).
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('rangeArea tooltip.y.formatter context', () => {
  it('receives the hovered seriesIndex and dataPointIndex', () => {
    /** @type {{ value: any, ctx: any }[]} */
    const seen = []
    const chart = createChartWithOptions({
      chart: { type: 'rangeArea', width: 400, height: 300 },
      series: [
        {
          name: 'low',
          data: [
            { x: 'a', y: [1, 5] },
            { x: 'b', y: [2, 6] },
          ],
        },
        {
          name: 'high',
          data: [
            { x: 'a', y: [3, 8] },
            { x: 'b', y: [4, 9] },
          ],
        },
      ],
      tooltip: {
        y: {
          /**
           * @param {any} value
           * @param {any} ctx
           */
          formatter(value, ctx) {
            seen.push({ value, ctx })
            return `Y${value}`
          },
        },
      },
    })

    seen.length = 0
    const html = chart.w.config.tooltip.custom({
      seriesIndex: 1,
      dataPointIndex: 1,
      w: chart.w,
    })

    expect(seen.map((call) => call.value)).toEqual([4, 9, 9])
    for (const { ctx } of seen) {
      expect(ctx).toMatchObject({ seriesIndex: 1, dataPointIndex: 1 })
      expect(ctx.w).toBe(chart.w)
    }
    expect(seen[0].ctx.series).toBe(chart.w.rangeData.seriesRangeStart)
    expect(seen[0].ctx.series[1][1]).toBe(4)
    expect(seen[1].ctx.series).toBe(chart.w.rangeData.seriesRangeEnd)
    expect(seen[1].ctx.series[1][1]).toBe(9)
    expect(seen[2].ctx.series).toBe(chart.w.seriesData.series)
    expect(seen[2].ctx.series[1][1]).toBe(9)
    expect(html).toContain('Y4')
    expect(html).toContain('Y9')
    chart.destroy()
  })
})
