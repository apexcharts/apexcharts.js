import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/drilldown.js'

const barChart = (n, drillable = true) =>
  createChartWithOptions({
    chart: { type: 'bar', animations: { enabled: false } },
    series: [
      {
        name: 'Sales',
        data: Array.from({ length: n }, (_, i) => ({
          x: `c${i}`,
          y: i + 1,
          ...(drillable ? { drilldown: `d${i}` } : {}),
        })),
      },
    ],
    drilldown: { enabled: true, series: [] },
  })

describe('drilldown: zoomFromPoint when the update is refused', () => {
  it('brings the faded marks back and passes the failure on', async () => {
    const chart = barChart(2)
    const cancel = vi.fn()
    const group = {
      style: {},
      animate: vi.fn(() => ({ finished: Promise.resolve(), cancel })),
    }
    chart.drilldown._markGroup = () => group
    const refused = new Error('refused')
    await expect(
      chart.drilldown._zoomDrill({ x: 1, y: 1 }, 'down', () => Promise.reject(refused)),
    ).rejects.toBe(refused)
    // The fill-forwards fade has to go, or the parent stays invisible.
    expect(cancel).toHaveBeenCalled()
    expect(group.style.opacity).toBe('')
    expect(group.style.transformBox).toBe('')
    expect(group.style.transformOrigin).toBe('')
    chart.destroy()
  })
})
