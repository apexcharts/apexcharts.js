import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The category to numeric x axis conversion skips every type that owns its
// plot (radar, heatmap, pie...), but its hand-written list left out treemap,
// so a treemap's config read `xaxis.type: 'numeric'` in every formatter and
// event callback, and its label formatter was rebuilt on every render.

describe('treemap x axis stays a category axis', () => {
  it('is not converted to numeric', () => {
    const chart = createChartWithOptions({
      chart: { type: 'treemap', width: 400, height: 300 },
      series: [
        {
          data: [
            { x: 'A', y: 10 },
            { x: 'B', y: 20 },
          ],
        },
      ],
    })
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBeFalsy()
    expect(chart.w.config.xaxis.type).toBe('category')
  })

  it('stays unconverted when a line chart becomes a treemap', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        {
          data: [
            { x: 'A', y: 10 },
            { x: 'B', y: 20 },
          ],
        },
      ],
    })
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBe(true)
    await chart.updateOptions({ chart: { type: 'treemap' } }, false, false)
    expect(chart.w.config.xaxis.convertedCatToNumeric).toBeFalsy()
    expect(chart.w.config.xaxis.type).toBe('category')
  })
})
