/**
 * Facet (#13) interaction tests: CSS design tokens + named themes.
 *
 * Fixtures:
 *   - misc/facet-design-tokens: an area chart whose colors come entirely from
 *     :root --apx-* tokens, with a light/dark class toggle and a "shuffle
 *     accent" button that changes only the CSS variable and calls
 *     chart.refreshTokens() (the 6.0 audit's runtime token-refresh path).
 *   - misc/facet-brand-theme: three ApexCharts.registerTheme entries and a
 *     dropdown switching theme.name at runtime.
 *
 * Real-browser only: token resolution reads getComputedStyle over the live CSS
 * cascade, which jsdom cannot do.
 */

import { test, expect } from '../fixtures/base.js'

const seriesColor = (page) =>
  page.evaluate(() => window.chart.w.globals.colors[0].toLowerCase())

test.describe('Facet: CSS design tokens', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'facet-design-tokens')
  })

  test('the palette and chrome resolve from the --apx-* tokens', async ({ page }) => {
    expect(await seriesColor(page)).toBe('#4f46e5') // :root --apx-accent
    const chrome = await page.evaluate(() => ({
      fore: window.chart.w.config.chart.foreColor.toLowerCase(),
      grid: window.chart.w.config.grid.borderColor.toLowerCase(),
    }))
    expect(chrome.fore).toBe('#1f2937') // --apx-fore
    // the fixture's grid.borderColor equals the built-in default sentinel, so
    // the token replaces it (only a NON-default explicit value wins over tokens)
    expect(chrome.grid).toBe('#e5e7eb') // --apx-grid
  })

  test('toggling the page theme swaps the token values on re-render', async ({
    page,
  }) => {
    await page.click('#toggle')
    await page.waitForFunction(
      () => window.chart.w.globals.colors[0].toLowerCase() === '#818cf8',
    )
    expect(await seriesColor(page)).toBe('#818cf8') // .apx-dark --apx-accent
  })

  test('refreshTokens() picks up a runtime CSS variable change (memo-proof)', async ({
    page,
  }) => {
    // A pure token change alters no chart option, so updateOptions({}) is
    // memoized away; refreshTokens() must re-read the cascade and re-render.
    await page.click('#shuffle')
    await page.waitForFunction(
      () => window.chart.w.globals.colors[0].toLowerCase() === '#e11d48',
    )
    expect(await seriesColor(page)).toBe('#e11d48')

    // and again, proving repeated refreshes are not memoized out either
    await page.click('#shuffle')
    await page.waitForFunction(
      () => window.chart.w.globals.colors[0].toLowerCase() === '#0e9d9a',
    )
    expect(await seriesColor(page)).toBe('#0e9d9a')
  })
})

test.describe('Facet: named themes (registerTheme)', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'facet-brand-theme')
  })

  test('theme.name applies the registered palette and switches at runtime', async ({
    page,
  }) => {
    expect(await seriesColor(page)).toBe('#ff6b6b') // sunset palette[0]
    await page.selectOption('#themePick', 'ocean')
    await page.waitForFunction(
      () => window.chart.w.globals.colors[0].toLowerCase() === '#0ca678',
    )
    expect(await seriesColor(page)).toBe('#0ca678') // ocean palette[0]
  })

  test('a registered dark theme carries its mode; unregisterTheme falls back', async ({
    page,
  }) => {
    await page.selectOption('#themePick', 'slate')
    await page.waitForFunction(
      () => window.chart.w.globals.colors[0].toLowerCase() === '#94a3b8',
    )
    expect(
      await page.evaluate(() =>
        window.chart.w.dom.elWrap.classList.contains('apexcharts-theme-dark'),
      ),
    ).toBe(true)

    // Unregister + re-render: the name stops resolving, built-ins return.
    const fallback = await page.evaluate(async () => {
      window.ApexCharts.unregisterTheme('slate')
      await window.chart.updateOptions({ theme: { name: 'slate' }, title: { text: 'after' } })
      return window.chart.w.globals.colors[0].toLowerCase()
    })
    expect(fallback).not.toBe('#94a3b8')
  })

  test('registerTheme validates its inputs without throwing', async ({ page }) => {
    const r = await page.evaluate(() => {
      const warnings = []
      const origWarn = console.warn
      console.warn = (...a) => warnings.push(a.join(' '))
      window.ApexCharts.registerTheme('', { palette: [] })
      window.ApexCharts.registerTheme('bad-def', 'not-an-object')
      console.warn = origWarn
      return {
        warned: warnings.length,
        badStored: !!globalThis.__apexcharts_themes__['bad-def'],
      }
    })
    expect(r.warned).toBe(2)
    expect(r.badStored).toBe(false)
  })
})
