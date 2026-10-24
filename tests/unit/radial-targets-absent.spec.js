import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Without `import 'apexcharts/features/radial-targets'` a gauge handed
// targets draws its dial as it always did and says once what is missing,
// across updates too.

afterEach(() => vi.restoreAllMocks())

const missing = (warn) =>
  warn.mock.calls.filter((c) =>
    String(c[0]).includes('features/radial-targets'),
  )

describe('radial targets not loaded', () => {
  test('targets draw nothing and warn once, naming the import', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = createChartWithOptions({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [62],
      plotOptions: { radialBar: { targets: [{ value: 80, label: { text: 'T' } }] } },
    })
    expect(chart.radialTargets).toBe(null)
    expect(chart.el.querySelector('.apexcharts-radial-targets')).toBeNull()
    expect(chart.el.querySelector('.apexcharts-radialbar')).not.toBeNull()
    // The core geometry is still there.
    expect(chart.getRadialScales()).not.toBeNull()
    expect(missing(warn).length).toBe(1)
    expect(String(missing(warn)[0][0])).toContain('radial-targets.js')
    await chart.updateSeries([30])
    await chart.updateOptions({ title: { text: 'again' } })
    expect(missing(warn).length).toBe(1)
    expect(chart.el.querySelector('.apexcharts-radial-targets')).toBeNull()
  })

  test('says nothing without targets', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createChartWithOptions({
      chart: { type: 'gauge', width: 400, height: 400 },
      series: [62],
    })
    expect(missing(warn).length).toBe(0)
  })
})
