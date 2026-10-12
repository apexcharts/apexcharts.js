import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A radar values update must take the full render: the fast path repaints the
// series layer only, and the radar's circle and marks jump on frame 0 of a
// mid-flight update when it does. The gate is implicit today: Radar reverses
// yAxisScale[0].result in place, so the on-screen scale signature never
// matches the fresh ascending one and fastUpdate falls back to update().
describe('radar updateSeries path', () => {
  it('never repaints a radar on the fast path', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'radar' },
      series: [{ name: 'a', data: [20, 40, 60, 80, 30] }],
      labels: ['a', 'b', 'c', 'd', 'e'],
    })
    // Same nice scale each time, so only the order can tell them apart.
    await chart.updateSeries([{ data: [25, 35, 65, 75, 30] }])
    await chart.updateSeries([{ data: [20, 40, 60, 80, 30] }])
    await chart.updateSeries([{ data: [30, 45, 55, 70, 35] }])
    expect(chart._updateStats.fast).toBe(0)
    expect(chart._updateStats.fastWithAxes).toBe(0)
    expect(chart._updateStats.full).toBe(3)
  })
})
