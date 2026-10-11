import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Goals are read by data-point index, so each parse must rebuild them rather
// than append behind the previous parse's entries.

describe('bar goals after updateSeries', () => {
  it('moves a goal to its new point and drops the old one', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false } },
      series: [
        {
          data: [
            { x: 'A', y: 1, goals: [{ name: 'g', value: 5 }] },
            { x: 'B', y: 2 },
          ],
        },
      ],
    })
    await chart.updateSeries([
      {
        data: [
          { x: 'A', y: 1 },
          { x: 'B', y: 2, goals: [{ name: 'g', value: 9 }] },
        ],
      },
    ])
    const goals = chart.w.seriesData.seriesGoals[0]
    expect(goals.length).toBe(2)
    expect(goals[0]).toBe(null)
    expect(goals[1][0].value).toBe(9)
    expect(chart.w.globals.maxY).toBeGreaterThanOrEqual(9)
  })

  it('does not grow on re-render', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', animations: { enabled: false } },
      series: [{ data: [{ x: 'A', y: 1, goals: [{ name: 'g', value: 5 }] }] }],
    })
    await chart.updateOptions({ title: { text: 'x' } })
    await chart.updateOptions({ title: { text: 'y' } })
    expect(chart.w.seriesData.seriesGoals[0].length).toBe(1)
  })
})
