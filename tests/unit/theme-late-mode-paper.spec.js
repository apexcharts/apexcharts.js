import { describe, it, expect, afterEach, vi } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'

/**
 * A mode that arrives after the config is read still paints the chart.
 *
 * Core.setupElements paints the SVG paper from theme.mode before Theme runs,
 * and the tooltip theme was only darkened at config time. A registered named
 * theme with mode 'dark' writes the mode in Theme, so its first render was
 * near-white text on a transparent paper with a light tooltip, and only the
 * next update painted the paper. theme.follow 'os' had the same light
 * tooltip. Theme now paints the paper once the mode is final, and a tooltip
 * theme the page did not name follows the mode.
 */

const DARK_PAPER = 'rgb(52, 58, 63)'
const LIGHT_PAPER = 'rgb(255, 255, 255)'

let hosts = 0

/**
 * @param {Record<string, any>} [opts]
 */
function make(opts = {}) {
  const el = document.createElement('div')
  el.id = `late-mode-host-${hosts++}`
  document.body.appendChild(el)
  return new ApexCharts(el, {
    ...opts,
    chart: { type: 'line', animations: { enabled: false }, ...opts.chart },
    series: [{ name: 'A', data: [1, 2, 3, 4] }],
    xaxis: { categories: ['a', 'b', 'c', 'd'] },
  })
}

/** @param {any} chart */
const paper = (chart) => chart.w.dom.Paper.node.style.background

/**
 * Paper, tooltip config and the tooltip element's class, all three.
 * @param {any} chart
 * @param {string} bg
 * @param {'light'|'dark'} tooltip
 */
function expectPainted(chart, bg, tooltip) {
  expect(paper(chart)).toBe(bg)
  expect(chart.w.config.tooltip.theme).toBe(tooltip)
  const tt = chart.el.querySelector('.apexcharts-tooltip')
  expect(tt).not.toBeNull()
  expect(tt.classList.contains(`apexcharts-theme-${tooltip}`)).toBe(true)
}

afterEach(() => {
  ;['nightP', 'nightQ', 'dayP', 'slateP'].forEach((n) =>
    ApexCharts.unregisterTheme(n),
  )
  delete window.matchMedia
  window.Apex = {}
  document.body.innerHTML = ''
})

describe('a registered named theme paints its mode on the first render', () => {
  it('a dark theme: dark paper and dark tooltip on render, update and refreshTokens', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    const chart = make({ theme: { name: 'nightP' } })
    await chart.render()
    expect(chart.w.config.theme.mode).toBe('dark')
    expect(chart.w.config.chart.foreColor).toBe('#f6f7f8')
    expectPainted(chart, DARK_PAPER, 'dark')
    await chart.updateOptions({ title: { text: 'x' } })
    expectPainted(chart, DARK_PAPER, 'dark')
    await chart.refreshTokens()
    expectPainted(chart, DARK_PAPER, 'dark')
    // export already resolved the paper from the final mode
    expect(chart.exports.resolveExportBackground()).toBe('#343A3F')
    chart.destroy()
  })

  it('a light theme: white paper and light tooltip', async () => {
    ApexCharts.registerTheme('dayP', { mode: 'light' })
    const chart = make({ theme: { name: 'dayP' } })
    await chart.render()
    expectPainted(chart, LIGHT_PAPER, 'light')
    await chart.updateOptions({ title: { text: 'x' } })
    expectPainted(chart, LIGHT_PAPER, 'light')
    await chart.refreshTokens()
    expectPainted(chart, LIGHT_PAPER, 'light')
    chart.destroy()
  })

  it('a dark theme set through updateOptions paints on that render', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    const chart = make()
    await chart.render()
    expectPainted(chart, '', 'light')
    await chart.updateOptions({ theme: { name: 'nightP' } })
    expectPainted(chart, DARK_PAPER, 'dark')
    chart.destroy()
  })

  it('clearing the name gives the paper and tooltip back on that render', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    const chart = make({ theme: { name: 'nightP' } })
    await chart.render()
    await chart.updateOptions({ theme: { name: '' } })
    expect(chart.w.config.theme.mode).toBe('')
    expect(chart.w.config.chart.foreColor).toBe('#373d3f')
    expectPainted(chart, '', 'light')
    chart.destroy()
  })

  it('switching between two dark themes keeps the tooltip dark', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    ApexCharts.registerTheme('nightQ', { mode: 'dark' })
    const chart = make({ theme: { name: 'nightP' } })
    await chart.render()
    await chart.updateOptions({ theme: { name: 'nightQ' } })
    expectPainted(chart, DARK_PAPER, 'dark')
    chart.destroy()
  })

  it('a token surface still wins over the dark paper', async () => {
    ApexCharts.registerTheme('slateP', {
      mode: 'dark',
      tokens: { surface: '#0f172a' },
    })
    const chart = make({ theme: { name: 'slateP' } })
    await chart.render()
    expect(paper(chart)).toBe('rgb(15, 23, 42)')
    await chart.updateOptions({ title: { text: 'x' } })
    expect(paper(chart)).toBe('rgb(15, 23, 42)')
    chart.destroy()
  })

  it('an explicit chart.background still wins over the dark paper', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    const chart = make({
      theme: { name: 'nightP' },
      chart: { background: '#123456' },
    })
    await chart.render()
    expect(paper(chart)).toBe('rgb(18, 52, 86)')
    chart.destroy()
  })

  it('an explicit light tooltip stays light under a dark theme', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    ApexCharts.registerTheme('nightQ', { mode: 'dark' })
    const chart = make({
      theme: { name: 'nightP' },
      tooltip: { theme: 'light' },
    })
    await chart.render()
    expectPainted(chart, DARK_PAPER, 'light')
    await chart.updateOptions({ theme: { name: 'nightQ' } })
    expectPainted(chart, DARK_PAPER, 'light')
    chart.destroy()
  })

  it('an explicit dark tooltip stays dark when the dark theme is cleared', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    const chart = make({
      theme: { name: 'nightP' },
      tooltip: { theme: 'dark' },
    })
    await chart.render()
    await chart.updateOptions({ theme: { name: '' } })
    expectPainted(chart, '', 'dark')
    chart.destroy()
  })
})

describe('theme.follow "os" paints the OS mode on the first render', () => {
  /** @param {{dark: boolean}} state */
  function mockMatchMedia(state) {
    /** @type {Function[]} */
    const listeners = []
    window.matchMedia = /** @type {any} */ (
      vi.fn((query) => ({
        media: query,
        get matches() {
          return query.includes('prefers-color-scheme') ? state.dark : false
        },
        addEventListener: (/** @type {any} */ _t, /** @type {Function} */ fn) =>
          listeners.push(fn),
        removeEventListener: (
          /** @type {any} */ _t,
          /** @type {Function} */ fn,
        ) => {
          const i = listeners.indexOf(fn)
          if (i > -1) listeners.splice(i, 1)
        },
      }))
    )
    return listeners
  }

  it('a dark OS: dark paper and dark tooltip, then light and back', async () => {
    const state = { dark: true }
    const listeners = mockMatchMedia(state)
    const chart = make({ theme: { follow: 'os' } })
    await chart.render()
    expect(chart.w.config.theme.mode).toBe('dark')
    expectPainted(chart, DARK_PAPER, 'dark')
    await chart.updateOptions({ title: { text: 'x' } })
    expectPainted(chart, DARK_PAPER, 'dark')
    await chart.refreshTokens()
    expectPainted(chart, DARK_PAPER, 'dark')

    state.dark = false
    listeners.slice().forEach((fn) => fn())
    await new Promise((r) => setTimeout(r, 60))
    expect(chart.w.config.theme.mode).toBe('light')
    expectPainted(chart, LIGHT_PAPER, 'light')

    state.dark = true
    listeners.slice().forEach((fn) => fn())
    await new Promise((r) => setTimeout(r, 60))
    expectPainted(chart, DARK_PAPER, 'dark')
    chart.destroy()
  })

  it('a light OS: white paper and light tooltip', async () => {
    mockMatchMedia({ dark: false })
    const chart = make({ theme: { follow: 'os' } })
    await chart.render()
    expectPainted(chart, LIGHT_PAPER, 'light')
    chart.destroy()
  })
})

describe('a responsive tooltip theme counts only while its breakpoint applies', () => {
  // jsdom's innerWidth is 1024: breakpoint 480 does not apply, 5000 does.
  for (const theme of ['light', 'dark']) {
    it(`named dark theme, inactive breakpoint with tooltip ${theme}: dark tooltip`, async () => {
      ApexCharts.registerTheme('nightP', { mode: 'dark' })
      const chart = make({
        theme: { name: 'nightP' },
        responsive: [{ breakpoint: 480, options: { tooltip: { theme } } }],
      })
      await chart.render()
      expectPainted(chart, DARK_PAPER, 'dark')
      await chart.updateOptions({ title: { text: 'x' } })
      expectPainted(chart, DARK_PAPER, 'dark')
      chart.destroy()
    })
  }

  it('named dark theme, active breakpoint with a light tooltip: light tooltip', async () => {
    ApexCharts.registerTheme('nightP', { mode: 'dark' })
    const chart = make({
      theme: { name: 'nightP' },
      responsive: [
        { breakpoint: 5000, options: { tooltip: { theme: 'light' } } },
      ],
    })
    await chart.render()
    expectPainted(chart, DARK_PAPER, 'light')
    chart.destroy()
  })

  it('follow "os" on a dark OS, inactive breakpoint: dark tooltip', async () => {
    window.matchMedia = /** @type {any} */ (
      vi.fn((query) => ({
        media: query,
        matches: query.includes('prefers-color-scheme'),
        addEventListener: () => {},
        removeEventListener: () => {},
      }))
    )
    const chart = make({
      theme: { follow: 'os' },
      responsive: [
        { breakpoint: 480, options: { tooltip: { theme: 'light' } } },
      ],
    })
    await chart.render()
    expect(chart.w.config.theme.mode).toBe('dark')
    expectPainted(chart, DARK_PAPER, 'dark')
    chart.destroy()
  })
})

describe('plain modes are painted as before', () => {
  for (const [mode, bg, tooltip] of /** @type {const} */ ([
    ['dark', DARK_PAPER, 'dark'],
    ['light', LIGHT_PAPER, 'light'],
    [undefined, '', 'light'],
  ])) {
    it(`mode ${mode || 'unset'}: render, update and refreshTokens`, async () => {
      const chart = make(mode ? { theme: { mode } } : {})
      await chart.render()
      expectPainted(chart, bg, tooltip)
      await chart.updateOptions({ title: { text: 'x' } })
      expectPainted(chart, bg, tooltip)
      await chart.refreshTokens()
      expectPainted(chart, bg, tooltip)
      chart.destroy()
    })
  }

  it('a responsive breakpoint tooltip theme still applies over the mode', async () => {
    const chart = make({
      theme: { mode: 'dark' },
      responsive: [
        { breakpoint: 100000, options: { tooltip: { theme: 'light' } } },
      ],
    })
    await chart.render()
    expect(chart.w.config.tooltip.theme).toBe('light')
    chart.destroy()
  })
})
