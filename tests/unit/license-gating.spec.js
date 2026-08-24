import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
// measure and link are Tier 2 and no longer in `entries/full.js`. This suite
// is about license gating, not bundling, so it imports each feature the way
// an application would and keeps asserting on a chart that HAS the tool.
import '../../src/features/measure.js'
import '../../src/features/link.js'
import { LicenseManager } from 'apex-commons'
import { installTestSigningKey, signedKey, forgedKey } from './utils/license-keys.js'
import {
  premiumFeaturesInUse,
  premiumFeatureInUse,
  enforceLicense,
  _enforcedCount,
  _resetPremiumSignals,
} from '../../src/modules/license/LicenseEnforcer.js'
import { Environment } from '../../src/utils/Environment.js'

const WM = '[data-apexcharts-watermark]'
installTestSigningKey()
// Premium plan: entitled to the premium feature set (see LicenseEnforcer
// PREMIUM_PLANS). Structurally valid but lower-tier keys are exercised in the
// "plan entitlement" block below.
const VALID_KEY = signedKey('2020-01-01', '2099-01-01', 'premium')

function resetLicense() {
  LicenseManager.licenseKey = null
  LicenseManager.validationResult = null
  LicenseManager._resetSignatureState()
  _resetPremiumSignals()
  if (typeof window !== 'undefined' && window.Apex) delete window.Apex.license
}

function hasWatermark(chart) {
  return !!chart.w.dom.elWrap.querySelector(WM)
}

// A line chart with a chart-config premium feature toggled on (or off).
function premiumLineChart(chartConfig = {}) {
  return createChartWithOptions({
    chart: { type: 'line', ...chartConfig },
    series: [{ name: 'A', data: [10, 20, 30, 40, 50] }],
    xaxis: { type: 'numeric' },
  })
}

// The 5 config-driven premium features and the chart config that enables each.
const CONFIG_FEATURES = [
  { name: 'measure', config: { measure: { enabled: true } } },
  { name: 'ink', config: { ink: { enabled: true } } },
  { name: 'context-menu', config: { contextMenu: { enabled: true } } },
  { name: 'history', config: { history: { enabled: true } } },
  { name: 'link', config: { link: { enabled: true } } },
]

describe('License gating', () => {
  let warnSpy
  let errorSpy

  beforeEach(() => {
    resetLicense()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    resetLicense()
  })

  // ── predicate: "in use", not "bundled" ────────────────────────────────────
  describe('premiumFeaturesInUse predicate', () => {
    CONFIG_FEATURES.forEach(({ name, config }) => {
      it(`flags "${name}" as in use when enabled`, () => {
        const chart = premiumLineChart(config)
        expect(premiumFeaturesInUse(chart.w, chart)).toContain(name)
        chart.destroy()
      })
    })

    it('flags "perspectives" after save()/apply() (API-driven)', () => {
      const chart = premiumLineChart()
      expect(premiumFeatureInUse(chart.w, chart)).toBe(false)
      chart.perspectives.save('v1')
      expect(premiumFeaturesInUse(chart.w, chart)).toContain('perspectives')
      chart.destroy()
    })

    it('flags "storyboard" once bound (bind() sets _used)', () => {
      const chart = premiumLineChart()
      expect(premiumFeatureInUse(chart.w, chart)).toBe(false)
      chart.storyboard._used = true // bind() sets this after binding beats
      expect(premiumFeaturesInUse(chart.w, chart)).toContain('storyboard')
      chart.destroy()
    })

    it('flags "unit" for a unit chart type (the type is the premium product)', () => {
      const chart = createChartWithOptions({
        chart: { type: 'unit', width: 480, height: 320 },
        series: [10, 20],
        labels: ['A', 'B'],
      })
      expect(premiumFeaturesInUse(chart.w, chart)).toContain('unit')
      chart.destroy()
    })

    it('does NOT flag a bundled-but-not-enabled premium feature', () => {
      const chart = premiumLineChart() // full bundle: all slots present, none enabled
      expect(chart.measure).toBeTruthy() // bundled
      expect(chart.ink).toBeTruthy()
      expect(chart.linkedViews).toBeTruthy()
      expect(chart.perspectives).toBeTruthy()
      expect(premiumFeaturesInUse(chart.w, chart)).toEqual([])
      chart.destroy()
    })

    it('does NOT flag free features / plain chart types', () => {
      const chart = premiumLineChart()
      expect(premiumFeatureInUse(chart.w, chart)).toBe(false)
      chart.destroy()
    })
  })

  // ── watermark presence on render ──────────────────────────────────────────
  describe('watermark on render', () => {
    CONFIG_FEATURES.forEach(({ name, config }) => {
      it(`"${name}" enabled + no license -> watermark present`, () => {
        const chart = premiumLineChart(config)
        expect(hasWatermark(chart)).toBe(true)
        chart.destroy()
      })

      it(`"${name}" enabled + valid license -> no watermark`, () => {
        ApexCharts.setLicense(VALID_KEY)
        const chart = premiumLineChart(config)
        expect(hasWatermark(chart)).toBe(false)
        chart.destroy()
      })
    })

    it('bundled-but-not-enabled -> no watermark', () => {
      const chart = premiumLineChart()
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })

    it('free-only chart -> no watermark and no console noise', () => {
      const chart = premiumLineChart()
      expect(hasWatermark(chart)).toBe(false)
      expect(warnSpy).not.toHaveBeenCalled()
      chart.destroy()
    })

    it('perspectives.save() -> watermark appears (API-driven, no re-render)', () => {
      const chart = premiumLineChart()
      expect(hasWatermark(chart)).toBe(false)
      chart.perspectives.save('v1')
      expect(hasWatermark(chart)).toBe(true)
      chart.destroy()
    })

    it('storyboard in use -> watermark via enforceLicense', () => {
      const chart = premiumLineChart()
      chart.storyboard._used = true
      enforceLicense(chart.w, chart)
      expect(hasWatermark(chart)).toBe(true)
      chart.destroy()
    })

    it('warns once (no key) naming the feature + pricing link', () => {
      const chart = premiumLineChart({ measure: { enabled: true } })
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0][0]).toMatch(/measure/)
      expect(warnSpy.mock.calls[0][0]).toMatch(/apexcharts\.com\/pricing/)
      chart.destroy()
    })
  })

  // ── key precedence + late licensing ───────────────────────────────────────
  describe('key resolution', () => {
    it('chart.license (valid) overrides an unset global -> no watermark', () => {
      const chart = premiumLineChart({ measure: { enabled: true }, license: VALID_KEY })
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })

    it('window.Apex.license (valid) is used when setLicense was not called', () => {
      window.Apex.license = VALID_KEY
      const chart = premiumLineChart({ measure: { enabled: true } })
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })

    it('late setLicense(validKey) + updateSeries() clears the watermark', async () => {
      const chart = premiumLineChart({ measure: { enabled: true } })
      expect(hasWatermark(chart)).toBe(true)
      ApexCharts.setLicense(VALID_KEY)
      await chart.updateSeries([{ name: 'A', data: [1, 2, 3, 4, 5] }])
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })

    it('invalid chart.license -> watermark + console.error', () => {
      const chart = premiumLineChart({ measure: { enabled: true }, license: 'APEX-broken' })
      expect(hasWatermark(chart)).toBe(true)
      expect(errorSpy).toHaveBeenCalled()
      chart.destroy()
    })
  })

  // ── async verdict reaches charts without a chart.id ───────────────────────
  //
  // A forged key passes the structural check, so the watermark decision made
  // during render says "licensed". The real verdict lands a microtask later and
  // has to correct it. That correction used to walk `Apex._chartInstances`,
  // which a chart joins only when the user declares `chart.id`, so a forged key
  // escaped the watermark entirely on every anonymous chart: the common case.
  describe('forged key correction after async verification', () => {
    // Premium plan so it is provisionally entitled: the watermark then appears
    // only when the signature verdict lands, which is what this block asserts.
    const FORGED = forgedKey('2020-01-01', '2099-01-01', 'premium')

    // Signature verification runs on crypto.subtle, which (as Web Crypto) resolves
    // on the libuv threadpool in real wall-clock time, not after a fixed number of
    // microtasks. The watermark is only corrected once that verdict lands and the
    // onChange listener re-evaluates. Poll for the verdict rather than draining a
    // fixed tick count, which raced the verify under full-suite load and made this
    // block flaky. `signatureVerified` flips true only once verify() has completed
    // (for both a passing and a failing verdict), so it is the "verification has
    // settled" signal; the onChange reconciliation runs synchronously right after.
    const awaitVerdict = (key) =>
      vi.waitFor(() =>
        expect(LicenseManager.validateKey(key).signatureVerified).toBe(true),
      )

    it('watermarks a chart with NO chart.id once verification fails', async () => {
      ApexCharts.setLicense(FORGED)
      const chart = premiumLineChart({ ink: { enabled: true } })
      expect(hasWatermark(chart)).toBe(false) // provisional: structurally valid
      await awaitVerdict(FORGED)
      expect(hasWatermark(chart)).toBe(true)
      chart.destroy()
    })

    it('watermarks a chart WITH a chart.id too', async () => {
      ApexCharts.setLicense(FORGED)
      const chart = premiumLineChart({ id: 'named', ink: { enabled: true } })
      await awaitVerdict(FORGED)
      expect(hasWatermark(chart)).toBe(true)
      chart.destroy()
    })

    it('leaves a genuinely signed key unwatermarked', async () => {
      ApexCharts.setLicense(VALID_KEY)
      const chart = premiumLineChart({ ink: { enabled: true } })
      await awaitVerdict(VALID_KEY)
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })

    it('stops tracking a chart on destroy, and on dropping premium usage', async () => {
      ApexCharts.setLicense(VALID_KEY)
      const before = _enforcedCount()

      const chart = premiumLineChart({ ink: { enabled: true } })
      expect(_enforcedCount()).toBe(before + 1)

      chart.destroy()
      expect(_enforcedCount()).toBe(before)

      // A free chart is never tracked: nothing to correct, so nothing to hold.
      const free = premiumLineChart()
      expect(_enforcedCount()).toBe(before)
      free.destroy()
    })
  })

  // ── plan entitlement: premium features need a Premium-or-above license ─────
  //
  // A structurally valid key is no longer enough. The issuing service sells
  // pro / premium / enterprise; only premium and the higher enterprise tier
  // unlock the premium feature set (the unit chart type + the seven features).
  describe('plan entitlement', () => {
    const premiumKey = signedKey('2020-01-01', '2099-01-01', 'premium')
    const enterpriseKey = signedKey('2020-01-01', '2099-01-01', 'enterprise')
    const proKey = signedKey('2020-01-01', '2099-01-01', 'pro')
    const standardKey = signedKey('2020-01-01', '2099-01-01', 'standard')

    it('premium plan -> no watermark', () => {
      ApexCharts.setLicense(premiumKey)
      const chart = premiumLineChart({ ink: { enabled: true } })
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })

    it('enterprise plan (higher tier) -> no watermark', () => {
      ApexCharts.setLicense(enterpriseKey)
      const chart = premiumLineChart({ ink: { enabled: true } })
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })

    it('pro plan -> watermark + a warning to upgrade (key valid, tier too low)', () => {
      ApexCharts.setLicense(proKey)
      const chart = premiumLineChart({ ink: { enabled: true } })
      expect(hasWatermark(chart)).toBe(true)
      expect(
        warnSpy.mock.calls.some((c) => /Premium or Enterprise/i.test(String(c[0]))),
      ).toBe(true)
      // Not reported as an invalid-key error: the licence is genuine.
      expect(
        errorSpy.mock.calls.some((c) => /invalid|does not verify/i.test(String(c[0]))),
      ).toBe(false)
      chart.destroy()
    })

    it('standard (free-tier) plan -> watermark', () => {
      ApexCharts.setLicense(standardKey)
      const chart = premiumLineChart({ ink: { enabled: true } })
      expect(hasWatermark(chart)).toBe(true)
      chart.destroy()
    })

    it('the unit chart type is plan-gated: pro -> watermark, premium -> none', () => {
      ApexCharts.setLicense(proKey)
      const proUnit = createChartWithOptions({
        chart: { type: 'unit', width: 480, height: 320 },
        series: [10, 20, 30],
        labels: ['A', 'B', 'C'],
      })
      expect(hasWatermark(proUnit)).toBe(true)
      proUnit.destroy()

      ApexCharts.setLicense(premiumKey)
      const premiumUnit = createChartWithOptions({
        chart: { type: 'unit', width: 480, height: 320 },
        series: [10, 20, 30],
        labels: ['A', 'B', 'C'],
      })
      expect(hasWatermark(premiumUnit)).toBe(false)
      premiumUnit.destroy()
    })

    it('a late upgrade from pro to premium clears the watermark', async () => {
      ApexCharts.setLicense(proKey)
      const chart = premiumLineChart({ ink: { enabled: true } })
      expect(hasWatermark(chart)).toBe(true)
      ApexCharts.setLicense(premiumKey)
      await chart.updateSeries([{ name: 'A', data: [1, 2, 3, 4, 5] }])
      expect(hasWatermark(chart)).toBe(false)
      chart.destroy()
    })
  })

  // ── SSR / no-DOM + ordering ───────────────────────────────────────────────
  describe('SSR and ordering guards', () => {
    it('enforceLicense is a no-op when not in a browser (no throw, no node)', () => {
      const spy = vi.spyOn(Environment, 'isBrowser').mockReturnValue(false)
      const elWrap = document.createElement('div')
      const w = { config: { chart: { measure: { enabled: true } } }, dom: { elWrap } }
      const ctx = { measure: {} }
      expect(() => enforceLicense(w, ctx)).not.toThrow()
      expect(elWrap.querySelector(WM)).toBeNull()
      spy.mockRestore()
    })

    it('does not throw or watermark when the DOM cache is not populated yet', () => {
      const w = { config: { chart: { measure: { enabled: true } } }, dom: {} }
      const ctx = { measure: {} }
      expect(() => enforceLicense(w, ctx)).not.toThrow()
    })
  })
})
