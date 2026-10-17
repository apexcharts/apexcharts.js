import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/measure.js'
import { LicenseManager, Watermark } from 'apex-commons'
import { installTestSigningKey, signedKey } from './utils/license-keys.js'
import { _resetPremiumSignals } from '../../src/modules/license/LicenseEnforcer.js'

// Every render of a free chart, and of a licensed premium one, ran
// Watermark.remove: a querySelector over the whole chart subtree for a
// watermark that was never painted. The enforcer now remembers whether it
// painted one and removes it only then. Which charts show a watermark is
// unchanged, including across updateOptions and with two charts on one page.

const WM = '[data-apexcharts-watermark]'
installTestSigningKey()
const VALID_KEY = signedKey('2020-01-01', '2099-01-01', 'premium')

function resetLicense() {
  LicenseManager.licenseKey = null
  LicenseManager.validationResult = null
  LicenseManager._resetSignatureState()
  _resetPremiumSignals()
}

const hasWatermark = (chart) => !!chart.w.dom.elWrap.querySelector(WM)

const opts = (chartConfig = {}) => ({
  chart: { type: 'line', animations: { enabled: false }, ...chartConfig },
  series: [{ name: 'A', data: [10, 20, 30, 40, 50] }],
  xaxis: { type: 'numeric' },
})
const lineChart = (chartConfig) => createChartWithOptions(opts(chartConfig))

describe('watermark teardown only runs for a painted watermark', () => {
  let removeSpy
  beforeEach(() => {
    resetLicense()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    removeSpy = vi.spyOn(Watermark, 'remove')
  })
  afterEach(() => {
    vi.restoreAllMocks()
    resetLicense()
  })

  it('a free chart never queries for a watermark across renders', async () => {
    const chart = lineChart()
    await chart.updateSeries([{ data: [5, 4, 3, 2, 1] }])
    await chart.updateOptions({ title: { text: 'T' } })
    expect(hasWatermark(chart)).toBe(false)
    expect(removeSpy).toHaveBeenCalledTimes(0)
  })

  it('a licensed premium chart never queries for a watermark', async () => {
    const chart = lineChart({ measure: { enabled: true }, license: VALID_KEY })
    await chart.updateOptions({ title: { text: 'T' } })
    expect(hasWatermark(chart)).toBe(false)
    expect(removeSpy).toHaveBeenCalledTimes(0)
  })

  it('two charts on a page keep their own watermark state through updates', async () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
    const mount = (id, config) => {
      const chart = new ApexCharts(document.getElementById(id), opts(config))
      chart.render()
      return chart
    }
    const licensed = mount('a', { measure: { enabled: true }, license: VALID_KEY })
    const trial = mount('b', { measure: { enabled: true } })
    expect([hasWatermark(licensed), hasWatermark(trial)]).toEqual([false, true])

    await licensed.updateOptions({ title: { text: 'L' } })
    await trial.updateOptions({ title: { text: 'T' } })
    expect([hasWatermark(licensed), hasWatermark(trial)]).toEqual([false, true])

    // Licensing the trial chart removes its watermark.
    await trial.updateOptions({ chart: { license: VALID_KEY } })
    expect([hasWatermark(licensed), hasWatermark(trial)]).toEqual([false, false])
    expect(removeSpy).toHaveBeenCalledTimes(1)

    // And a further render has nothing left to remove.
    await trial.updateOptions({ title: { text: 'T2' } })
    expect(hasWatermark(trial)).toBe(false)
    expect(removeSpy).toHaveBeenCalledTimes(1)
  })

  it('a trial chart that stops using premium features drops its watermark', async () => {
    const chart = lineChart({ measure: { enabled: true } })
    expect(hasWatermark(chart)).toBe(true)
    await chart.updateOptions({ chart: { measure: { enabled: false } } })
    expect(hasWatermark(chart)).toBe(false)
    await chart.updateOptions({ chart: { measure: { enabled: true } } })
    expect(hasWatermark(chart)).toBe(true)
  })
})
