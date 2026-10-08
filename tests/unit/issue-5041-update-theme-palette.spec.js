import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #5041: updateThemeOptions() reset an explicit theme.palette back to
 * palette1/palette4 whenever theme.mode was also present in the same
 * updateOptions() call. checkForDarkTheme() at config time only fills a
 * default when the field is absent; updateThemeOptions() must follow the
 * same rule so a palette set alongside mode survives.
 */
describe('issue 5041: updateOptions preserves an explicit palette set with mode', () => {
  it('keeps the palette the caller passed together with theme.mode', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', animations: { enabled: false } },
      series: [{ name: 'A', data: [1, 2, 3, 4] }],
      theme: { mode: 'dark' },
    })
    await chart.render()

    await chart.updateOptions({
      theme: { mode: 'light', palette: 'palette7' },
    })

    expect(chart.w.config.theme.palette).toBe('palette7')
    chart.destroy()
  })

  it('keeps a caller-provided foreColor set together with theme.mode', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', animations: { enabled: false } },
      series: [{ name: 'A', data: [1, 2, 3, 4] }],
      theme: { mode: 'light' },
    })
    await chart.render()

    await chart.updateOptions({
      theme: { mode: 'dark' },
      chart: { foreColor: '#112233' },
    })

    expect(chart.w.config.chart.foreColor).toBe('#112233')
    chart.destroy()
  })

  it('still falls back to the mode default palette with no explicit one', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', animations: { enabled: false } },
      series: [{ name: 'A', data: [1, 2, 3, 4] }],
      theme: { mode: 'light' },
    })
    await chart.render()

    await chart.updateOptions({ theme: { mode: 'dark' } })

    expect(chart.w.config.theme.palette).toBe('palette4')
    chart.destroy()
  })
})
