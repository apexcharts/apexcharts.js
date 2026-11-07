import { describe, it, expect, vi, afterEach } from 'vitest'
import * as commons from 'apex-commons'
import ApexCharts from '../../src/entries/standard.js'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'

// Plan 36, phase 1A: the token read, the named-theme registry, the chrome and
// surface write-back and the OS watcher now come from apex-commons. These pin
// the behaviour they replaced, value for value (the parity table in
// plans/36-findings/phase0/resolver-design.md, section 2.2).

const { getTheme } = commons

const NAMES = ['p1', 'p3', 'p3b', 'p4', 'm1', 'p8', 'ssrBrand', 'commonsSide']

afterEach(() => {
  NAMES.forEach((n) => ApexCharts.unregisterTheme(n))
  delete window.matchMedia
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

async function chartWith(options) {
  document.body.innerHTML = '<div id="chart"></div>'
  const chart = new ApexCharts(document.querySelector('#chart'), {
    series: [{ name: 'A', data: [1, 2, 3, 4] }],
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

/** Every slot the grid token feeds, in Theme's order. */
function gridSlots(w) {
  const out = [w.config.grid.borderColor]
  ;[w.config.xaxis].concat(w.config.yaxis).forEach((a) => {
    out.push(a.axisBorder.color, a.axisTicks.color)
  })
  return out
}

/**
 * Serve `--apx-*` from `vars` through the real getComputedStyle, which
 * jsdom does not cascade custom properties for.
 */
function stubTokens(vars) {
  const real = window.getComputedStyle.bind(window)
  return vi.spyOn(window, 'getComputedStyle').mockImplementation((el, p) => {
    const cs = real(el, p)
    return new Proxy(cs, {
      get(t, k) {
        if (k === 'getPropertyValue') {
          return (n) =>
            n.startsWith('--apx-') ? (vars[n] ?? '') : t.getPropertyValue(n)
        }
        const v = t[k]
        return typeof v === 'function' ? v.bind(t) : v
      },
    })
  })
}

// The commons surface 1A builds on arrived after commons 0.9.0 (projects
// 4b44349). Neither published release has it: 0.8.3 and 0.9.0 lack
// resolveOwnedRole, the `host` option of readTokens and OSThemeWatcher, and
// `watcher.supports`. These name the missing piece when the installed commons
// is too old, instead of every chart throwing mid-render.
describe('the apex-commons surface phase 1A needs', () => {
  it('exports resolveOwnedRole', () => {
    expect(typeof commons.resolveOwnedRole).toBe('function')
  })

  it('readTokens reads through the host it is given', () => {
    const el = document.createElement('div')
    const host = {
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: (n) => (n === '--apx-fore' ? ' #123456 ' : ''),
      })),
    }
    const pageRead = vi.spyOn(window, 'getComputedStyle')
    expect(commons.readTokens(el, { host })).toEqual({ fore: '#123456' })
    expect(host.getComputedStyle).toHaveBeenCalledWith(el)
    expect(pageRead).not.toHaveBeenCalled()
  })

  it('OSThemeWatcher queries the host and reports what it understood', () => {
    const host = {
      matchMedia: vi.fn((q) => ({
        media: q.includes('contrast') ? 'not all' : q,
        matches: false,
        addEventListener() {},
        removeEventListener() {},
      })),
    }
    const watcher = new commons.OSThemeWatcher({ host, onChange() {} })
    expect(host.matchMedia).toHaveBeenCalledTimes(2)
    expect(watcher.supports).toEqual({ scheme: true, contrast: false })
    watcher.dispose()
  })
})

describe('theme registry on apex-commons', () => {
  it('keeps the shared key from import and shares entries both ways', () => {
    expect(typeof globalThis.__apexcharts_themes__).toBe('object')
    ApexCharts.registerTheme('p1', { palette: ['#010203'] })
    expect(getTheme('p1')).toBe(globalThis.__apexcharts_themes__.p1)
    expect(getTheme('p1').palette).toEqual(['#010203'])
  })

  it('warns on a bad name or definition, stores nothing, and chains', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(ApexCharts.registerTheme('', {})).toBe(ApexCharts)
    expect(ApexCharts.registerTheme('p1', 'nope')).toBe(ApexCharts)
    expect(ApexCharts.registerTheme('p3', ['#fff'])).toBe(ApexCharts)
    expect(warn).toHaveBeenCalledTimes(3)
    expect(globalThis.__apexcharts_themes__.p1).toBeUndefined()
    expect(globalThis.__apexcharts_themes__.p3).toBeUndefined()

    expect(ApexCharts.registerTheme('p4', null)).toBe(ApexCharts)
    expect(globalThis.__apexcharts_themes__.p4).toEqual({})
    expect(ApexCharts.unregisterTheme('p4')).toBe(ApexCharts)
    expect(globalThis.__apexcharts_themes__.p4).toBeUndefined()
  })

  it('a theme registered from another product drives a chart', async () => {
    globalThis.__apexcharts_themes__.commonsSide = {
      tokens: { accent: '#010203' },
    }
    const chart = await chartWith({ theme: { name: 'commonsSide' } })
    expect(chart.w.globals.colors.slice(0, 2)).toEqual(['#010203', '#008FFB'])
    chart.destroy()
  })
})

describe('chrome write-back on resolveOwnedRole', () => {
  it('replaces its own foreColor on a token change and restores the default when it goes (P1, P2)', async () => {
    ApexCharts.registerTheme('p1', { tokens: { fore: '#111111' } })
    const chart = await chartWith({ theme: { name: 'p1' } })
    expect(chart.w.config.chart.foreColor).toBe('#111111')

    ApexCharts.registerTheme('p1', { tokens: { fore: '#eeeeee' } })
    await chart.refreshTokens()
    expect(chart.w.config.chart.foreColor).toBe('#eeeeee')

    ApexCharts.registerTheme('p1', { tokens: {} })
    await chart.refreshTokens()
    expect(chart.w.config.chart.foreColor).toBe('#373d3f')
    expect(chart.w.globals.tokenChrome).toEqual({
      fore: undefined,
      grid: undefined,
    })
    chart.destroy()
  })

  it('keeps an explicit foreColor equal to the other mode default (P3)', async () => {
    ApexCharts.registerTheme('p3', { tokens: { fore: '#123456' } })
    const chart = await chartWith({
      chart: { foreColor: '#f6f7f8' },
      theme: { mode: '', name: 'p3' },
    })
    expect(chart.w.config.chart.foreColor).toBe('#f6f7f8')
    chart.destroy()
  })

  it('replaces a non-explicit other-mode default (P3b)', async () => {
    ApexCharts.registerTheme('p3b', { tokens: {} })
    const chart = await chartWith({ theme: { mode: '', name: 'p3b' } })
    chart.w.config.chart.foreColor = '#f6f7f8'
    ApexCharts.registerTheme('p3b', { tokens: { fore: '#123456' } })
    await chart.refreshTokens()
    expect(chart.w.config.chart.foreColor).toBe('#123456')
    chart.destroy()
  })

  // P4 changed with 1B (D5): an explicit value equal to the mode default is
  // the page's choice and beats the token. The axes it did not name still
  // take the token.
  it('an explicit value equal to the mode default beats the token (P4, D5)', async () => {
    ApexCharts.registerTheme('p4', {
      tokens: { fore: '#abcdef', grid: '#abcdef' },
    })
    const chart = await chartWith({
      chart: { foreColor: '#373d3f' },
      grid: { borderColor: '#e0e0e0' },
      theme: { name: 'p4' },
    })
    expect(chart.w.config.chart.foreColor).toBe('#373d3f')
    expect(chart.w.config.grid.borderColor).toBe('#e0e0e0')
    expect(chart.w.config.xaxis.axisBorder.color).toBe('#abcdef')
    chart.destroy()
  })

  it('moves every grid slot together over three y axes, and keeps a page colour (M1)', async () => {
    ApexCharts.registerTheme('m1', { tokens: { grid: '#00aa00' } })
    const chart = await chartWith({
      series: [
        { name: 'A', data: [1, 2, 3, 4] },
        { name: 'B', data: [4, 3, 2, 1] },
        { name: 'C', data: [2, 2, 3, 3] },
      ],
      yaxis: [{}, { opposite: true }, { axisBorder: { color: '#ff0000' } }],
      theme: { name: 'm1' },
    })
    const w = chart.w
    const expectAll = (c) => {
      const slots = gridSlots(w)
      expect(slots.length).toBe(9)
      // the third y axis border is the page's own colour
      expect(slots.filter((_, i) => i !== 7)).toEqual(Array(8).fill(c))
      expect(slots[7]).toBe('#ff0000')
    }
    expectAll('#00aa00')

    ApexCharts.registerTheme('m1', { tokens: { grid: '#bb0000' } })
    await chart.refreshTokens()
    expectAll('#bb0000')

    ApexCharts.registerTheme('m1', { tokens: {} })
    await chart.refreshTokens()
    expectAll('#e0e0e0')
    chart.destroy()
  })
})

describe('the --apx-* read through BrowserAPIs', () => {
  it('reads CSS tokens, follows a change and a removal on refreshTokens', async () => {
    const vars = { '--apx-fore': '#111111', '--apx-grid': '#00aa00' }
    stubTokens(vars)
    const seen = vi.spyOn(BrowserAPIs, 'getComputedStyle')
    const chart = await chartWith({})
    expect(seen).toHaveBeenCalledWith(chart.w.dom.elWrap)
    expect(chart.w.config.chart.foreColor).toBe('#111111')
    expect(chart.w.config.grid.borderColor).toBe('#00aa00')

    vars['--apx-fore'] = '#eeeeee'
    await chart.refreshTokens()
    expect(chart.w.config.chart.foreColor).toBe('#eeeeee')

    delete vars['--apx-fore']
    delete vars['--apx-grid']
    await chart.refreshTokens()
    expect(chart.w.config.chart.foreColor).toBe('#373d3f')
    expect(chart.w.config.grid.borderColor).toBe('#e0e0e0')
    chart.destroy()
  })

  it('stops the series list at the first gap (P7)', async () => {
    stubTokens({
      '--apx-series-1': '#aa0000',
      '--apx-series-3': '#00aa00',
      '--apx-accent': '#123456',
    })
    const chart = await chartWith({
      series: [
        { name: 'A', data: [1, 2] },
        { name: 'B', data: [2, 1] },
      ],
    })
    expect(chart.w.globals.colors).toEqual(['#aa0000', '#aa0000'])
    chart.destroy()
  })

  it('tokens:false skips the CSS but keeps the named theme tokens (P8)', async () => {
    stubTokens({ '--apx-fore': '#dd0000' })
    ApexCharts.registerTheme('p8', { tokens: { fore: '#0b0b0b' } })
    const off = await chartWith({ theme: { name: 'p8', tokens: false } })
    expect(off.w.config.chart.foreColor).toBe('#0b0b0b')
    off.destroy()
    const on = await chartWith({ theme: { name: 'p8', tokens: 'auto' } })
    expect(on.w.config.chart.foreColor).toBe('#dd0000')
    on.destroy()
  })

  it('server rendering never reaches the global getComputedStyle', async () => {
    ApexCharts.registerTheme('ssrBrand', { tokens: { fore: '#0b0b0b' } })
    const spy = vi.spyOn(globalThis, 'getComputedStyle')
    const saved = [global.window, global.document, global.navigator]
    global.window = undefined
    global.document = undefined
    global.navigator = undefined
    BrowserAPIs._resetShim()
    try {
      const svg = await SSRRenderer.renderToString({
        chart: { type: 'line', width: 400, height: 200 },
        series: [{ data: [1, 2, 3] }],
        theme: { name: 'ssrBrand' },
      })
      expect(svg).toContain('#0b0b0b')
    } finally {
      ;[global.window, global.document, global.navigator] = saved
      BrowserAPIs._resetShim()
    }
    expect(spy).not.toHaveBeenCalled()
  })
})

describe('OS watcher on apex-commons', () => {
  function mockMatchMedia(state) {
    const listeners = []
    window.matchMedia = vi.fn((query) => ({
      media: query,
      get matches() {
        return query.includes('prefers-color-scheme')
          ? state.dark
          : state.contrast
      },
      addEventListener: (_t, fn) => listeners.push(fn),
      removeEventListener: (_t, fn) => {
        const i = listeners.indexOf(fn)
        if (i > -1) listeners.splice(i, 1)
      },
    }))
    return listeners
  }
  const flip = async (listeners) => {
    listeners.slice().forEach((fn) => fn())
    await new Promise((r) => setTimeout(r, 60))
  }

  it('holds one watcher per chart across updates, disposed on destroy', async () => {
    const listeners = mockMatchMedia({ dark: false, contrast: false })
    const chart = await chartWith({ theme: { follow: 'os' } })
    expect(listeners.length).toBe(2)
    await chart.updateOptions({ title: { text: 'a' } })
    await chart.updateOptions({ title: { text: 'b' } })
    expect(listeners.length).toBe(2)
    const schemeQueries = window.matchMedia.mock.calls.filter(([q]) =>
      q.includes('prefers-color-scheme'),
    )
    expect(schemeQueries.length).toBe(1)
    chart.destroy()
    expect(listeners.length).toBe(0)
  })

  it('OS dark beats an explicit light mode, and a flip re-themes', async () => {
    const state = { dark: true, contrast: false }
    const listeners = mockMatchMedia(state)
    const chart = await chartWith({ theme: { follow: 'os', mode: 'light' } })
    expect(chart.w.config.theme.mode).toBe('dark')
    state.dark = false
    await flip(listeners)
    expect(chart.w.config.theme.mode).toBe('light')
    chart.destroy()
  })

  it('leaving OS high contrast still clears the colour-blind mode (O5, unchanged)', async () => {
    const state = { dark: false, contrast: true }
    const listeners = mockMatchMedia(state)
    const chart = await chartWith({
      theme: {
        follow: 'os',
        accessibility: { colorBlindMode: 'deuteranopia' },
      },
    })
    expect(chart.w.config.theme.accessibility.colorBlindMode).toBe(
      'highContrast',
    )
    state.contrast = false
    await flip(listeners)
    expect(chart.w.config.theme.accessibility.colorBlindMode).toBe('')
    chart.destroy()
  })

  it('does nothing without matchMedia', async () => {
    const chart = await chartWith({ theme: { follow: 'os', mode: 'dark' } })
    expect(chart.w.config.theme.mode).toBe('dark')
    expect(chart._osTheme).toBeFalsy()
    chart.destroy()
  })
})
