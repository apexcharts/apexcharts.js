import { describe, it, expect, afterEach } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/history.js'
import { getThemePalettes } from '../../src/utils/ThemePalettes.js'
// The Ignite UI layer is an add-on (plan 36): without it a sheet's --ig-*
// tokens are ignored.
import '../../src/features/ignite-ui.js'
import { igniteSheet } from './utils/ignite-ui-sheet.js'

// Plan 36, phase 1B: the design-system layer (Ignite UI's --ig-* tokens)
// ranks fifth, D5: explicit option > product CSS variable > --apx-* > named
// theme or explicit palette > --ig-* > built-in defaults. "Explicit" means
// the page passed the value (flags), never "differs from the default".

const NAMES = ['d5named', 'd5fore']
const FAMILIES = ['primary', 'secondary', 'info', 'success', 'warn', 'error']
// Rows 1-6 at seed, 7-12 at 300, 13-18 at 700 (contract section 2).
const ROWS = ['seed', '300', '700'].flatMap((step) =>
  FAMILIES.map((f) => `--ig-${f}-${step}`),
)
const DEFAULT_FONT = 'Helvetica, Arial, sans-serif'

/** @type {ReturnType<typeof igniteSheet> | null} */
let page = null

afterEach(() => {
  page?.restore()
  page = null
  NAMES.forEach((n) => ApexCharts.unregisterTheme(n))
  window.Apex = {}
  document.body.innerHTML = ''
})

/** @param {Record<string, any>} [options] */
async function chartWith(options = {}) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    series: [
      { name: 'A', data: [1, 2, 3, 4] },
      { name: 'B', data: [4, 3, 2, 1] },
      { name: 'C', data: [2, 2, 3, 3] },
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

/** grid.borderColor, then border and ticks of the x axis and each y axis. */
function gridSlots(w) {
  const out = [w.config.grid.borderColor]
  ;[w.config.xaxis].concat(w.config.yaxis).forEach((a) => {
    out.push(a.axisBorder.color, a.axisTicks.color)
  })
  return out
}

const igniteRows = () => ROWS.map((t) => page.hex(t))

describe('the design system on a light Ignite UI sheet', () => {
  it('fills the palette rows 1 to 18 in contract order, as hex', async () => {
    // Bootstrap's rows 7 to 18 are relative colours (`hsl(from ...)`) as
    // Chromium returns them; they resolve, and never reach the chart as text
    page = igniteSheet({ sheet: 'light/bootstrap' })
    expect(page.vars['--ig-primary-300']).toMatch(/^hsl\(from /)
    const chart = await chartWith({})
    const colors = chart.w.globals.colors
    expect(colors.slice(0, 18)).toEqual(igniteRows())
    expect(colors.every((c) => /^#[0-9a-f]{6}$/.test(c))).toBe(true)
    chart.destroy()
  })

  it('fills fore, grid, axis and font where nothing ranks above it', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({ yaxis: [{}, { opposite: true }] })
    const w = chart.w
    expect(w.config.chart.foreColor).toBe(page.hex('--ig-gray-800'))
    expect(gridSlots(w)).toEqual(Array(7).fill(page.hex('--ig-gray-300')))
    expect(w.config.chart.fontFamily).toBe('Nunito Sans, sans-serif')
    expect(w.config.theme.mode).toBe('')
    expect(w.globals.variantModeApplied).toBeUndefined()
    // the design system never paints the paper
    expect(w.config.chart.background).toBe('')
    expect(w.dom.Paper.node.style.background).toBe('')
    chart.destroy()
  })
})

describe('every layer above the design system beats it (D5)', () => {
  it('an explicit colors option', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({ colors: ['#111111', '#222222', '#333333'] })
    expect(chart.w.globals.colors).toEqual(['#111111', '#222222', '#333333'])
    chart.destroy()
  })

  it('a --apx-series-* list, taken whole', async () => {
    page = igniteSheet({
      sheet: 'light/indigo',
      apx: { '--apx-series-1': '#aa0000', '--apx-series-2': '#00aa00' },
    })
    const chart = await chartWith({})
    expect(chart.w.globals.colors).toEqual(['#aa0000', '#00aa00', '#aa0000'])
    chart.destroy()
  })

  it('--apx-accent replaces row 1 and the design system fills the rest (OPEN-10)', async () => {
    page = igniteSheet({
      sheet: 'light/indigo',
      apx: { '--apx-accent': '#123456' },
    })
    const chart = await chartWith({})
    expect(chart.w.globals.colors.slice(0, 18)).toEqual([
      '#123456',
      ...igniteRows().slice(1),
    ])
    chart.destroy()
  })

  it('a named theme palette, and Ignite UI primary never seeds colors[0] ahead of it', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    ApexCharts.registerTheme('d5named', {
      palette: ['#101010', '#202020', '#303030'],
    })
    const chart = await chartWith({ theme: { name: 'd5named' } })
    expect(chart.w.globals.colors).toEqual(['#101010', '#202020', '#303030'])
    chart.destroy()
  })

  it('an explicit theme.palette', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({ theme: { palette: 'palette3' } })
    expect(chart.w.globals.colors).toEqual(getThemePalettes().palette3)
    chart.destroy()
  })

  it('an explicit foreColor, its default included', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({ chart: { foreColor: '#373d3f' } })
    expect(chart.w.config.chart.foreColor).toBe('#373d3f')
    chart.destroy()
  })

  it('--apx-fore, --apx-grid and --apx-font-family', async () => {
    page = igniteSheet({
      sheet: 'light/indigo',
      apx: {
        '--apx-fore': '#0f0f0f',
        '--apx-grid': '#00aa00',
        '--apx-font-family': 'Inter, sans-serif',
      },
    })
    const chart = await chartWith({})
    expect(chart.w.config.chart.foreColor).toBe('#0f0f0f')
    expect(gridSlots(chart.w)).toEqual(Array(5).fill('#00aa00'))
    expect(chart.w.config.chart.fontFamily).toBe('Inter, sans-serif')
    chart.destroy()
  })

  it("a named theme's tokens", async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    ApexCharts.registerTheme('d5named', {
      tokens: { fore: '#0b0b0b', grid: '#0c0c0c' },
    })
    const chart = await chartWith({ theme: { name: 'd5named' } })
    expect(chart.w.config.chart.foreColor).toBe('#0b0b0b')
    expect(gridSlots(chart.w)).toEqual(Array(5).fill('#0c0c0c'))
    // the named theme names no palette, so the series stay the sheet's
    expect(chart.w.globals.colors.slice(0, 18)).toEqual(igniteRows())
    chart.destroy()
  })
})

describe('D5 flags for the grid and axis colours and the font', () => {
  it('a grid or axis colour the page named is kept, its default included', async () => {
    page = igniteSheet({
      sheet: 'light/indigo',
      apx: { '--apx-grid': '#00aa00' },
    })
    const chart = await chartWith({
      grid: { borderColor: '#e0e0e0' },
      xaxis: { type: 'numeric', axisTicks: { color: '#e0e0e0' } },
      yaxis: [{ axisBorder: { color: '#e0e0e0' } }, { opposite: true }],
    })
    // grid, x border, x ticks, y0 border, y0 ticks, y1 border, y1 ticks
    expect(gridSlots(chart.w)).toEqual([
      '#e0e0e0',
      '#00aa00',
      '#e0e0e0',
      '#e0e0e0',
      '#00aa00',
      '#00aa00',
      '#00aa00',
    ])
    chart.destroy()
  })

  it('window.Apex counts as the page', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    window.Apex = {
      chart: { fontFamily: DEFAULT_FONT },
      grid: { borderColor: '#e0e0e0' },
      yaxis: { axisBorder: { color: '#e0e0e0' } },
    }
    const chart = await chartWith({})
    const w = chart.w
    expect(w.config.chart.fontFamily).toBe(DEFAULT_FONT)
    expect(w.config.grid.borderColor).toBe('#e0e0e0')
    expect(w.config.yaxis[0].axisBorder.color).toBe('#e0e0e0')
    expect(w.config.xaxis.axisBorder.color).toBe(page.hex('--ig-gray-300'))
    chart.destroy()
  })

  it('an explicit default font beats --apx-font-family and --ig-font-family', async () => {
    page = igniteSheet({
      sheet: 'light/indigo',
      apx: { '--apx-font-family': 'Inter, sans-serif' },
    })
    const chart = await chartWith({ chart: { fontFamily: DEFAULT_FONT } })
    expect(chart.w.config.chart.fontFamily).toBe(DEFAULT_FONT)
    delete page.apx['--apx-font-family']
    await chart.refreshTokens()
    expect(chart.w.config.chart.fontFamily).toBe(DEFAULT_FONT)
    chart.destroy()
  })

  it("updateOptions makes a named font or colour the page's, y axes by the payload", async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({ yaxis: [{}, { opposite: true }] })
    const igGrid = page.hex('--ig-gray-300')
    expect(chart.w.config.grid.borderColor).toBe(igGrid)
    await chart.updateOptions({
      chart: { fontFamily: DEFAULT_FONT },
      grid: { borderColor: '#e0e0e0' },
      xaxis: { axisBorder: { color: '#e0e0e0' } },
      yaxis: [{ axisTicks: { color: '#e0e0e0' } }, { opposite: true }],
    })
    await chart.refreshTokens()
    const w = chart.w
    expect(w.config.chart.fontFamily).toBe(DEFAULT_FONT)
    expect(gridSlots(w)).toEqual([
      '#e0e0e0',
      '#e0e0e0',
      igGrid,
      igGrid,
      '#e0e0e0',
      igGrid,
      igGrid,
    ])
    expect(w.globals.themeGridColorsExplicit).toEqual({
      grid: true,
      xaxis: { border: true, ticks: false },
      yaxis: [
        { border: false, ticks: true },
        { border: false, ticks: false },
      ],
    })
    chart.destroy()
  })

  it('the flags survive a responsive breakpoint and a History undo', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({
      chart: {
        fontFamily: DEFAULT_FONT,
        history: { enabled: true, coalesceMs: 20 },
      },
      grid: { borderColor: '#e0e0e0' },
      responsive: [{ breakpoint: 99999, options: { title: { text: 'r' } } }],
    })
    const settle = () => new Promise((r) => setTimeout(r, 80))
    await settle()
    expect(chart.w.config.title.text).toBe('r')
    expect(chart.w.config.grid.borderColor).toBe('#e0e0e0')
    expect(chart.w.config.chart.fontFamily).toBe(DEFAULT_FONT)

    await chart.updateOptions({ subtitle: { text: 's' } }, false, false)
    await settle()
    await chart.history.undo()
    await settle()
    // the restore replays the whole config; the choices stay the page's,
    // and the colours the page did not name stay replaceable
    expect(chart.w.globals.themeFontFamilyExplicit).toBe(true)
    expect(chart.w.globals.themeGridColorsExplicit.grid).toBe(true)
    expect(chart.w.globals.themeGridColorsExplicit.xaxis.border).toBe(false)
    page.use('light/bootstrap')
    await chart.refreshTokens()
    expect(chart.w.config.grid.borderColor).toBe('#e0e0e0')
    expect(chart.w.config.chart.fontFamily).toBe(DEFAULT_FONT)
    expect(chart.w.config.xaxis.axisBorder.color).toBe(
      page.hex('--ig-gray-300'),
    )
    chart.destroy()
  })

  it('a zoom hands back the axes it copied without naming their colours', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({ yaxis: [{}, { opposite: true }] })
    // the zoom's own update carries copies of every axis, colours included
    chart.zoomX(2, 3)
    await new Promise((r) => setTimeout(r, 50))
    expect(chart.w.globals.themeGridColorsExplicit.yaxis).toEqual([
      { border: false, ticks: false },
      { border: false, ticks: false },
    ])
    page.use('light/bootstrap')
    await chart.refreshTokens()
    expect(gridSlots(chart.w)).toEqual(Array(7).fill(page.hex('--ig-gray-300')))
    chart.destroy()
  })
})

describe('what holds the design system back', () => {
  it("the mode gate: a dark sheet's text and hairlines skip a light chart", async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({ theme: { mode: 'light' } })
    const w = chart.w
    expect(w.config.theme.mode).toBe('light')
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(gridSlots(w)).toEqual(Array(5).fill('#e0e0e0'))
    // series and font do not change with the variant
    expect(w.globals.colors.slice(0, 18)).toEqual(igniteRows())
    expect(w.config.chart.fontFamily).toBe('Nunito Sans, sans-serif')
    chart.destroy()
  })

  it('colorBlindMode bypasses its colours, not its font', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({
      theme: { accessibility: { colorBlindMode: 'deuteranopia' } },
    })
    const w = chart.w
    expect(w.globals.colors.slice(0, 3)).toEqual(
      getThemePalettes().cvdDeuteranopia.slice(0, 3),
    )
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(w.config.grid.borderColor).toBe('#e0e0e0')
    expect(w.config.chart.fontFamily).toBe('Nunito Sans, sans-serif')
    chart.destroy()
  })

  it('monochrome bypasses its colours', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({
      theme: { monochrome: { enabled: true, color: '#008FFB' } },
    })
    const w = chart.w
    expect(w.globals.colors[0].toLowerCase()).toBe('#008ffb')
    expect(w.globals.colors).not.toContain(page.hex('--ig-primary-seed'))
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(w.config.grid.borderColor).toBe('#e0e0e0')
    chart.destroy()
  })

  it('theme.tokens:false and theme.designSystem:false read no --ig-* token', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    for (const theme of [{ tokens: false }, { designSystem: false }]) {
      page.reads.length = 0
      const chart = await chartWith({ theme })
      const w = chart.w
      expect(page.igReads()).toEqual([])
      expect(w.globals.colors.slice(0, 5)).toEqual(getThemePalettes().palette1)
      expect(w.config.chart.foreColor).toBe('#373d3f')
      expect(w.config.chart.fontFamily).toBe(DEFAULT_FONT)
      chart.destroy()
    }
    // tokens:false skips --apx-* too; designSystem:false keeps them
    page.apx['--apx-fore'] = '#0f0f0f'
    const off = await chartWith({ theme: { designSystem: false } })
    expect(off.w.config.chart.foreColor).toBe('#0f0f0f')
    off.destroy()
  })

  // With the add-on loaded; without it there are no reads at all
  // (ignite-ui-addon.spec.js).
  it('a page without Ignite UI pays the two probe reads and renders as before', async () => {
    page = igniteSheet({ sheet: null })
    const chart = await chartWith({})
    const w = chart.w
    expect(page.igReads()).toEqual(['--ig-primary-seed', '--ig-primary-500'])
    expect(w.globals.colors.slice(0, 5)).toEqual(getThemePalettes().palette1)
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(gridSlots(w)).toEqual(Array(5).fill('#e0e0e0'))
    expect(w.config.chart.fontFamily).toBe(DEFAULT_FONT)
    expect(w.globals.tokenChrome).toEqual({})
    page.reads.length = 0
    await chart.refreshTokens()
    expect(page.igReads()).toEqual(['--ig-primary-seed', '--ig-primary-500'])
    chart.destroy()
  })

  it('refreshTokens gives back every default when the sheet goes', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({})
    page.use(null)
    await chart.refreshTokens()
    const w = chart.w
    expect(w.globals.colors.slice(0, 5)).toEqual(getThemePalettes().palette1)
    expect(w.config.chart.foreColor).toBe('#373d3f')
    expect(gridSlots(w)).toEqual(Array(5).fill('#e0e0e0'))
    expect(w.config.chart.fontFamily).toBe(DEFAULT_FONT)
    chart.destroy()
  })
})
