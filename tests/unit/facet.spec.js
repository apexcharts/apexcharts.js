import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'

// ---------------------------------------------------------------------------
// Facet (#13): named themes (ThemeRegistry) + OS-aware theming (OSThemeWatcher).
// CSS --apx-* token reads need a real cascade, so those paths are covered by
// the Playwright suite (tests/interaction/specs/facet.spec.js); here we cover
// the registry, the named-theme resolution chain, and the matchMedia watcher.
// ---------------------------------------------------------------------------

function themedChart(theme = {}, extraChart = {}) {
  return createChartWithOptions({
    chart: { type: 'line', animations: { enabled: false }, ...extraChart },
    series: [{ name: 'A', data: [1, 2, 3, 4] }],
    xaxis: { type: 'numeric' },
    theme,
  })
}

afterEach(() => {
  ;['brand', 'accented', 'darkbrand'].forEach((n) => ApexCharts.unregisterTheme(n))
  delete window.matchMedia
})

describe('Facet: named themes', () => {
  it('theme.name applies the registered palette and token chrome', async () => {
    ApexCharts.registerTheme('brand', {
      palette: ['#123456', '#654321'],
      tokens: { fore: '#222222' },
    })
    const chart = themedChart({ name: 'brand' })
    await chart.render()
    expect(chart.w.globals.colors[0]).toBe('#123456')
    expect(chart.w.config.chart.foreColor).toBe('#222222')
    chart.destroy()
  })

  it('a token accent seeds the palette when the theme has no palette', async () => {
    ApexCharts.registerTheme('accented', { tokens: { accent: '#0e9d9a' } })
    const chart = themedChart({ name: 'accented' })
    await chart.render()
    expect(chart.w.globals.colors[0]).toBe('#0e9d9a')
    chart.destroy()
  })

  it('a registered dark theme sets the mode unless the user set one', async () => {
    ApexCharts.registerTheme('darkbrand', { mode: 'dark', palette: ['#94a3b8'] })
    const chart = themedChart({ name: 'darkbrand' })
    await chart.render()
    expect(chart.w.config.theme.mode).toBe('dark')
    expect(
      chart.w.dom.elWrap.classList.contains('apexcharts-theme-dark'),
    ).toBe(true)
    chart.destroy()
  })

  it('validates inputs and supports unregisterTheme fallback', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    ApexCharts.registerTheme('', { palette: [] })
    ApexCharts.registerTheme('bad', 'nope')
    expect(warn).toHaveBeenCalledTimes(2)
    expect(globalThis.__apexcharts_themes__.bad).toBeUndefined()
    warn.mockRestore()

    ApexCharts.registerTheme('brand', { palette: ['#123456'] })
    ApexCharts.unregisterTheme('brand')
    const chart = themedChart({ name: 'brand' })
    await chart.render()
    expect(chart.w.globals.colors[0]).not.toBe('#123456') // built-in fallback
    chart.destroy()
  })
})

describe('Facet: OS theme watcher (theme.follow: "os")', () => {
  function mockMatchMedia(state) {
    const listeners = []
    window.matchMedia = vi.fn((query) => ({
      media: query,
      get matches() {
        return query.includes('prefers-color-scheme') ? state.dark : state.contrast
      },
      addEventListener: (_t, fn) => listeners.push(fn),
      removeEventListener: (_t, fn) => {
        const i = listeners.indexOf(fn)
        if (i > -1) listeners.splice(i, 1)
      },
    }))
    return listeners
  }

  it('resolves the initial mode from the OS and follows a change', async () => {
    const state = { dark: true, contrast: false }
    const listeners = mockMatchMedia(state)

    const chart = themedChart({ follow: 'os' })
    await chart.render()
    expect(chart.w.config.theme.mode).toBe('dark')

    // the OS flips to light: every registered handler fires
    state.dark = false
    listeners.slice().forEach((fn) => fn())
    await new Promise((r) => setTimeout(r, 60))
    expect(chart.w.config.theme.mode).toBe('light')
    chart.destroy()
  })

  it('removes the matchMedia listener on destroy', async () => {
    const state = { dark: false, contrast: false }
    const listeners = mockMatchMedia(state)

    const chart = themedChart({ follow: 'os' })
    await chart.render()
    expect(listeners.length).toBeGreaterThan(0)
    chart.destroy()
    expect(listeners.length).toBe(0)
  })
})
