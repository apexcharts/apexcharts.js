/**
 * A chart that cannot zoom (a category bar) hides its zoom tools for that
 * render only. The page's toolbar config keeps the tools it asked for, so a
 * later switch to a zoomable chart shows them again.
 */
import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import './__mocks__/ResizeObserver.js'

afterEach(() => {
  document.body.innerHTML = ''
})

function host() {
  const d = document.createElement('div')
  document.body.appendChild(d)
  return d
}

describe('zoom tools after a type change', () => {
  it('a category bar switched to a datetime area gets its zoom tools back', async () => {
    const chart = new ApexCharts(host(), {
      chart: { type: 'bar', width: 400, height: 300, animations: { enabled: false } },
      series: [{ name: 'a', data: [1, 2, 3] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    await chart.render()
    expect(chart.w.config.chart.toolbar.tools.zoomin).toBe(true)
    expect(chart.el.querySelector('.apexcharts-zoomin-icon')).toBeNull()

    await chart.updateOptions({
      chart: { type: 'area' },
      xaxis: { type: 'datetime', categories: [] },
      series: [
        {
          name: 'a',
          data: [
            [Date.UTC(2025, 0, 1), 1],
            [Date.UTC(2025, 0, 2), 2],
            [Date.UTC(2025, 0, 3), 3],
          ],
        },
      ],
    })
    expect(chart.w.config.chart.toolbar.tools.zoomin).toBe(true)
    expect(chart.el.querySelector('.apexcharts-zoomin-icon')).not.toBeNull()
    expect(chart.el.querySelector('.apexcharts-reset-icon')).not.toBeNull()
    chart.destroy()
  })
})
