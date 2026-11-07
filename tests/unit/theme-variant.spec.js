import { describe, it, expect, afterEach, vi } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/history.js'
import Theme from '../../src/modules/Theme.js'
import { getThemePalettes } from '../../src/utils/ThemePalettes.js'
import { igniteSheet } from './utils/ignite-ui-sheet.js'

// Plan 36, phase 1C: the design system's variant (--ig-theme-variant) is the
// lowest source of the mode (D6). It fills an unset theme.mode only, a light
// variant writes nothing, and the fill is recorded so a light or removed
// sheet, or a mode the page sets, takes it back. A dark mode from the variant
// leaves the paper transparent (D6b).

const NAMES = ['vlight', 'vdark']
const DARK_PAPER = 'rgb(52, 58, 63)'
const WHITE = 'rgb(255, 255, 255)'

/** @type {ReturnType<typeof igniteSheet> | null} */
let page = null

afterEach(() => {
  page?.restore()
  page = null
  NAMES.forEach((n) => ApexCharts.unregisterTheme(n))
  delete window.matchMedia
  window.Apex = {}
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

/** @param {Record<string, any>} [options] */
async function chartWith(options = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    series: [
      { name: 'A', data: [1, 2, 3, 4] },
      { name: 'B', data: [4, 3, 2, 1] },
    ],
    xaxis: { type: 'numeric' },
    ...options,
    chart: {
      type: 'line',
      animations: { enabled: false },
      ...(options.chart || {}),
    },
  })
  await chart.render()
  return chart
}

/** @param {any} chart */
const paper = (chart) => chart.w.dom.Paper.node.style.background
/** @param {any} chart */
const themeClass = (chart) =>
  [...chart.w.dom.elWrap.classList].find((c) =>
    c.startsWith('apexcharts-theme-'),
  )

describe('the variant fills an unset mode (D6)', () => {
  it('a dark sheet makes the chart dark on a transparent paper (D6b)', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({})
    const w = chart.w
    expect(w.config.theme.mode).toBe('dark')
    expect(w.globals.variantModeApplied).toEqual({ state: 'light' })
    expect(themeClass(chart)).toBe('apexcharts-theme-dark')
    expect(paper(chart)).toBe('')
    expect(w.config.chart.background).toBe('')
    expect(w.config.tooltip.theme).toBe('dark')
    expect(w.config.theme.palette).toBe('palette4')
    // the gate opens: the dark sheet's text and hairlines apply
    expect(w.config.chart.foreColor).toBe(page.hex('--ig-gray-800'))
    expect(w.config.grid.borderColor).toBe(page.hex('--ig-gray-300'))
    expect(w.globals.colors[0]).toBe(page.hex('--ig-primary-seed'))
    chart.destroy()
  })

  it('--apx-surface and chart.background still paint it', async () => {
    page = igniteSheet({
      sheet: 'dark/indigo',
      apx: { '--apx-surface': '#101820' },
    })
    const token = await chartWith({})
    expect(token.w.config.theme.mode).toBe('dark')
    expect(paper(token)).toBe('rgb(16, 24, 32)')
    token.destroy()
    delete page.apx['--apx-surface']
    const option = await chartWith({ chart: { background: '#202020' } })
    expect(paper(option)).toBe('rgb(32, 32, 32)')
    option.destroy()
  })

  it('a dark mode the page set keeps the dark paper', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({ theme: { mode: 'dark' } })
    expect(chart.w.globals.variantModeApplied).toBeUndefined()
    expect(paper(chart)).toBe(DARK_PAPER)
    chart.destroy()
  })

  it('an explicit light mode beats a dark variant', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({ theme: { mode: 'light' } })
    expect(chart.w.config.theme.mode).toBe('light')
    expect(chart.w.globals.variantModeApplied).toBeUndefined()
    expect(paper(chart)).toBe(WHITE)
    chart.destroy()
  })

  it("a named theme's mode beats the variant", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    ApexCharts.registerTheme('vlight', { mode: 'light' })
    const chart = await chartWith({ theme: { name: 'vlight' } })
    expect(chart.w.config.theme.mode).toBe('light')
    expect(chart.w.globals.variantModeApplied).toBeUndefined()
    chart.destroy()
  })

  it("theme.follow: 'os' beats the variant", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    window.matchMedia = vi.fn((query) => ({
      media: query,
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }))
    const chart = await chartWith({ theme: { follow: 'os' } })
    expect(chart.w.config.theme.mode).toBe('light')
    expect(chart.w.globals.variantModeApplied).toBeUndefined()
    chart.destroy()
  })

  it('a light variant writes no mode and no white paper', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({})
    expect(chart.w.config.theme.mode).toBe('')
    expect(chart.w.globals.variantModeApplied).toBeUndefined()
    expect(themeClass(chart)).toBe('apexcharts-theme-light')
    expect(paper(chart)).toBe('')
    chart.destroy()
  })
})

describe('taking the variant back', () => {
  it('refreshTokens after the sheet turns light runs the light defaults', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({})
    page.use('light/indigo')
    await chart.refreshTokens()
    const w = chart.w
    expect(w.config.theme.mode).toBe('')
    expect(w.globals.variantModeApplied).toBeUndefined()
    expect(themeClass(chart)).toBe('apexcharts-theme-light')
    expect(w.config.theme.palette).toBe('palette1')
    expect(w.config.tooltip.theme).toBe('light')
    expect(paper(chart)).toBe('')
    // the light sheet's own text and hairlines replace the dark ones
    expect(w.config.chart.foreColor).toBe(page.hex('--ig-gray-800'))
    expect(w.config.grid.borderColor).toBe(page.hex('--ig-gray-300'))
    chart.destroy()
  })

  it('refreshTokens after the sheet is removed restores the defaults', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({})
    page.use(null)
    await chart.refreshTokens()
    const w = chart.w
    expect(w.config.theme.mode).toBe('')
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(w.config.grid.borderColor).toBe('#e0e0e0')
    expect(w.config.chart.fontFamily).toBe('Helvetica, Arial, sans-serif')
    expect(w.config.theme.palette).toBe('palette1')
    expect(w.globals.colors.slice(0, 5)).toEqual(getThemePalettes().palette1)
    expect(w.config.tooltip.theme).toBe('light')
    chart.destroy()
  })

  it('a pie keeps its dark tooltip after the variant is taken back', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({
      chart: { type: 'pie' },
      series: [1, 2, 3],
      labels: ['a', 'b', 'c'],
      xaxis: {},
    })
    expect(chart.w.config.theme.mode).toBe('dark')
    expect(chart.w.globals.variantModeApplied).toEqual({ state: 'dark' })
    page.use(null)
    await chart.refreshTokens()
    expect(chart.w.config.theme.mode).toBe('')
    expect(chart.w.config.tooltip.theme).toBe('dark')
    chart.destroy()
  })

  it("a mode the page passes is the page's: a later light sheet keeps it", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({})
    await chart.updateOptions({ theme: { mode: 'dark' } })
    expect(chart.w.globals.variantModeApplied).toBeUndefined()
    expect(paper(chart)).toBe(DARK_PAPER)
    page.use('light/indigo')
    await chart.refreshTokens()
    expect(chart.w.config.theme.mode).toBe('dark')
    expect(paper(chart)).toBe(DARK_PAPER)
    chart.destroy()
  })

  it('a light mode the page passes runs the light defaults at once', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({})
    await chart.updateOptions({ theme: { mode: 'light' } })
    const w = chart.w
    expect(w.config.theme.mode).toBe('light')
    expect(w.globals.variantModeApplied).toBeUndefined()
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(w.config.grid.borderColor).toBe('#e0e0e0')
    expect(w.config.tooltip.theme).toBe('light')
    expect(paper(chart)).toBe(WHITE)
    chart.destroy()
  })

  it('a newly named dark theme survives a variant take-back in the same render', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    ApexCharts.registerTheme('vdark', { mode: 'dark' })
    const chart = await chartWith({})
    page.use(null)
    await chart.updateOptions({ theme: { name: 'vdark' } })
    const w = chart.w
    expect(w.config.theme.mode).toBe('dark')
    expect(w.globals.namedThemeApplied).toEqual({ mode: 'dark' })
    expect(w.globals.variantModeApplied).toBeUndefined()
    expect(paper(chart)).toBe(DARK_PAPER)
    chart.destroy()
  })

  // follow:'os' passed later attaches no OS watcher (as on a page without
  // Ignite UI), so the variant's mode goes back to unset rather than staying
  // as if the page had chosen it.
  it("switching to theme.follow: 'os' gives the variant's mode back", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    window.matchMedia = vi.fn((query) => ({
      media: query,
      matches: false,
      addEventListener() {},
      removeEventListener() {},
    }))
    const chart = await chartWith({})
    expect(chart.w.globals.variantModeApplied).toEqual({ state: 'light' })
    await chart.updateOptions({ theme: { follow: 'os' } })
    const w = chart.w
    expect(w.config.theme.mode).toBe('')
    expect(w.globals.variantModeApplied).toBeUndefined()
    expect(paper(chart)).toBe('')
    expect(w.config.tooltip.theme).toBe('light')
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(w.config.theme.palette).toBe('palette1')
    chart.destroy()
    // the same call on a page without the sheet leaves the mode unset too
    page.use(null)
    const plain = await chartWith({})
    await plain.updateOptions({ theme: { follow: 'os' } })
    expect(plain.w.config.theme.mode).toBe('')
    expect(paper(plain)).toBe('')
    plain.destroy()
  })

  // D5: a named theme ranks above the design system, so its mode wins
  // whether the page names it in the options or in a later call.
  it('a named light theme passed later beats the dark variant', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    ApexCharts.registerTheme('vlight', { mode: 'light' })
    /** @param {any} chart */
    const lightByName = (chart) => {
      const w = chart.w
      expect(w.config.theme.mode).toBe('light')
      expect(w.globals.namedThemeApplied).toEqual({ mode: 'light' })
      expect(w.globals.variantModeApplied).toBeUndefined()
      expect(paper(chart)).toBe(WHITE)
      expect(w.config.chart.foreColor).toBe('#373d3f')
      expect(w.config.tooltip.theme).toBe('light')
    }
    const first = await chartWith({ theme: { name: 'vlight' } })
    lightByName(first)
    first.destroy()
    const later = await chartWith({})
    expect(later.w.globals.variantModeApplied).toEqual({ state: 'light' })
    await later.updateOptions({ theme: { name: 'vlight' } })
    lightByName(later)
    later.destroy()
  })

  it("a named dark theme passed later is not the variant's: the dark paper, kept on a light sheet", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    ApexCharts.registerTheme('vdark', { mode: 'dark' })
    /** @param {any} chart */
    const darkByName = (chart) => {
      expect(chart.w.config.theme.mode).toBe('dark')
      expect(chart.w.globals.namedThemeApplied).toEqual({ mode: 'dark' })
      expect(chart.w.globals.variantModeApplied).toBeUndefined()
      expect(paper(chart)).toBe(DARK_PAPER)
    }
    const first = await chartWith({ theme: { name: 'vdark' } })
    darkByName(first)
    first.destroy()
    const later = await chartWith({})
    await later.updateOptions({ theme: { name: 'vdark' } })
    darkByName(later)
    page.use('light/indigo')
    await later.refreshTokens()
    darkByName(later)
    later.destroy()
  })
})

describe('the paper and its other sites (D6b)', () => {
  it('Core paints a later render transparent too', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({})
    const seen = vi.spyOn(Theme, 'modePaper')
    await chart.updateOptions({ title: { text: 'again' } })
    // Core.setupElements, then Theme.applyModePaper
    expect(seen.mock.results.length).toBeGreaterThanOrEqual(2)
    expect(seen.mock.results.every((r) => r.value === '')).toBe(true)
    expect(paper(chart)).toBe('')
    chart.destroy()
  })

  it("radar polygons are 'none' under a variant dark mode, the dark paper under the page's", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const radar = {
      chart: { type: 'radar' },
      series: [{ name: 'A', data: [1, 2, 3, 4, 5] }],
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
    }
    const variant = await chartWith(radar)
    expect(variant.w.globals.radarPolygons.fill.colors[0]).toBe('none')
    variant.destroy()
    const own = await chartWith({ ...radar, theme: { mode: 'dark' } })
    expect(own.w.globals.radarPolygons.fill.colors[0]).toBe('#343A3F')
    own.destroy()
  })

  it("a PNG base: the sheet's surface under a variant dark mode, else the dark paper", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const indigo = await chartWith({})
    // 7.4.1 has no --ig-surface-base; --ig-surface-500 stands in
    expect(indigo.exports.resolveExportBackground()).toBe(
      page.hex('--ig-surface-500'),
    )
    indigo.destroy()

    page.use('dark/material@7.5.0-beta.0')
    const next = await chartWith({})
    expect(next.exports.resolveExportBackground()).toBe('#222222')
    next.destroy()

    page.use('dark/indigo')
    delete page.vars['--ig-surface-500']
    const bare = await chartWith({})
    expect(bare.w.config.theme.mode).toBe('dark')
    expect(bare.exports.resolveExportBackground()).toBe('#343A3F')
    bare.destroy()

    // a dark mode the page set keeps the dark paper, sheet or not
    page.use('dark/indigo')
    const own = await chartWith({ theme: { mode: 'dark' } })
    expect(own.exports.resolveExportBackground()).toBe('#343A3F')
    own.destroy()
  })

  it('an SVG export gets the PNG base under a variant dark mode, the screen keeps none', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    /** @param {any} chart the paper's background in the file */
    const exported = (chart) => {
      let bg = null
      vi.spyOn(chart.exports, 'applyExportStyles').mockImplementation(
        (/** @type {any} */ node) => {
          bg = node.querySelector('.apexcharts-svg').style.background
        },
      )
      chart.exports.getSvgString().catch(() => {})
      return bg
    }
    /** @param {string} color as jsdom serialises it */
    const css = (color) => {
      const el = document.createElement('div')
      el.style.background = color
      return el.style.background
    }
    const variant = await chartWith({})
    expect(exported(variant)).toBe(css(page.hex('--ig-surface-500')))
    expect(paper(variant)).toBe('')
    variant.destroy()

    const own = await chartWith({ theme: { mode: 'dark' } })
    expect(exported(own)).toBe(DARK_PAPER)
    own.destroy()

    page.use(null)
    const plain = await chartWith({})
    expect(exported(plain)).toBe('')
    plain.destroy()
  })

  it('a PNG base without Ignite UI is unchanged', async () => {
    page = igniteSheet({ sheet: null })
    const plain = await chartWith({})
    expect(plain.exports.resolveExportBackground()).toBe('#fff')
    plain.destroy()
    const dark = await chartWith({ theme: { mode: 'dark' } })
    expect(dark.exports.resolveExportBackground()).toBe('#343A3F')
    dark.destroy()
  })
})

describe('what switches the variant off', () => {
  it('designSystem:false and tokens:false: no --ig-* reads, no fill', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    for (const theme of [{ designSystem: false }, { tokens: false }]) {
      page.reads.length = 0
      const chart = await chartWith({ theme })
      expect(page.igReads()).toEqual([])
      expect(chart.w.config.theme.mode).toBe('')
      expect(chart.w.globals.variantModeApplied).toBeUndefined()
      chart.destroy()
    }
  })

  it('designSystem:false later takes a variant mode back', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({})
    expect(chart.w.config.theme.mode).toBe('dark')
    await chart.updateOptions({ theme: { designSystem: false } })
    expect(chart.w.config.theme.mode).toBe('')
    expect(chart.w.config.chart.foreColor).toBe('#373d3f')
    chart.destroy()
  })

  it('colorBlindMode and monochrome keep the variant, not the colours', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const cvd = await chartWith({
      theme: { accessibility: { colorBlindMode: 'protanopia' } },
    })
    expect(cvd.w.config.theme.mode).toBe('dark')
    expect(cvd.w.globals.variantModeApplied).toBeDefined()
    expect(paper(cvd)).toBe('')
    expect(cvd.w.globals.colors.slice(0, 3)).toEqual(
      getThemePalettes().cvdProtanopia.slice(0, 3),
    )
    expect(cvd.w.config.chart.foreColor).toBe('#f6f7f8')
    expect(cvd.w.config.grid.borderColor).toBe('#e0e0e0')
    cvd.destroy()

    const mono = await chartWith({ theme: { monochrome: { enabled: true } } })
    expect(mono.w.config.theme.mode).toBe('dark')
    expect(mono.w.globals.colors).not.toContain(page.hex('--ig-primary-seed'))
    expect(mono.w.config.chart.foreColor).toBe('#f6f7f8')
    mono.destroy()
  })
})

describe('History carries the variant record', () => {
  const settle = () => new Promise((r) => setTimeout(r, 80))

  it("an undo keeps a variant dark mode the variant's", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({
      chart: { history: { enabled: true, coalesceMs: 20 } },
    })
    await settle()
    await chart.updateOptions({ title: { text: 'x' } }, false, false)
    await settle()
    await chart.history.undo()
    await settle()
    // the restore replays theme.mode 'dark'; it stays the variant's
    expect(chart.w.config.theme.mode).toBe('dark')
    expect(chart.w.globals.variantModeApplied).toEqual({ state: 'light' })
    expect(paper(chart)).toBe('')
    page.use(null)
    await chart.refreshTokens()
    expect(chart.w.config.theme.mode).toBe('')
    expect(chart.w.config.tooltip.theme).toBe('light')
    chart.destroy()
  })

  it("an undo to a page's dark mode keeps it the page's", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({
      chart: { history: { enabled: true, coalesceMs: 20 } },
      theme: { mode: 'dark' },
    })
    await settle()
    await chart.updateOptions({ title: { text: 'x' } }, false, false)
    await settle()
    await chart.history.undo()
    await settle()
    expect(chart.w.globals.variantModeApplied).toBeUndefined()
    expect(paper(chart)).toBe(DARK_PAPER)
    chart.destroy()
  })
})
