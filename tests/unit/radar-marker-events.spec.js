import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('radar marker events', () => {
  it('fires dataPointMouseEnter and dataPointSelection from a marker', () => {
    const events = []
    const chart = createChartWithOptions({
      chart: {
        type: 'radar',
        events: {
          dataPointMouseEnter: (e, ctx, { seriesIndex, dataPointIndex }) =>
            events.push(['enter', seriesIndex, dataPointIndex]),
          dataPointSelection: (e, ctx, { seriesIndex, dataPointIndex }) =>
            events.push(['select', seriesIndex, dataPointIndex]),
        },
      },
      series: [{ name: 'a', data: [40, 15, 14, 20, 11] }],
      labels: ['a', 'b', 'c', 'd', 'e'],
      markers: { size: 6 },
    })

    const target = [...document.querySelectorAll('.apexcharts-marker')].find(
      (m) => m.getAttribute('index') === '0' && m.getAttribute('j') === '2',
    )
    expect(target).toBeTruthy()
    target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))

    expect(events).toContainEqual(['enter', 0, 2])
    expect(events).toContainEqual(['select', 0, 2])

    chart.destroy()
  })
})
