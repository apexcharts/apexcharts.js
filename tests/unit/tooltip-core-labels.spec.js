import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const tick = () => new Promise((r) => setTimeout(r, 0))

describe('tooltip.cssClass', () => {
  it('takes a space-separated list of classes', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      tooltip: { cssClass: 'one  two' },
    })
    await tick()
    const el = chart.w.globals.tooltip.getElTooltip()
    expect(el).not.toBeNull()
    expect(el.classList.contains('one')).toBe(true)
    expect(el.classList.contains('two')).toBe(true)
    chart.destroy()
  })
})
