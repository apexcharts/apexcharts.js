import { describe, it, expect, vi } from 'vitest'
import ApexCharts from '../../src/entries/core.js'
import '../../src/entries/line.js'
import '../../src/features/marks.js'

// On a lean-core page, an update to a default-bundle type
// the page never loaded must be refused before anything moves, exactly like
// the opt-in (RESERVED_TYPES) refusal in missing-type-features.spec.js.
describe('lean core: update to an unloaded default-bundle type', () => {
  it('rejects updateOptions({chart:{type:"bar"}}) and the line chart keeps working', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    document.body.innerHTML = '<div id="c"></div>'
    const el = document.querySelector('#c')
    const chart = new ApexCharts(el, {
      chart: {
        type: 'line',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      series: [{ name: 'S', data: [1, 2, 3] }],
    })
    await chart.render()
    const paths = () => el.querySelectorAll('.apexcharts-series path').length
    const before = paths()
    expect(before).toBeGreaterThan(0)

    await expect(
      chart.updateOptions({ chart: { type: 'bar' } }),
    ).rejects.toThrow('chart type "bar" is not registered')
    // refused before anything moved
    expect(chart.w.config.chart.type).toBe('line')
    expect(paths()).toBe(before)

    // and later updates still work
    await chart.updateSeries([{ name: 'S', data: [3, 2, 1] }])
    expect(paths()).toBe(before)
    chart.destroy()
  })

  it('registerSeriesType refuses a built-in name whose class is not loaded', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ApexCharts.registerSeriesType('heatmap', { renderItem: () => null })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('would override the built-in "heatmap"'),
    )
    warn.mockRestore()
  })
})
