import { describe, it, expect, afterEach, vi } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
// The Ignite UI layer is an add-on (plan 36): without it a sheet's --ig-*
// tokens are ignored.
import '../../src/features/ignite-ui.js'
import { igniteSheet } from './utils/ignite-ui-sheet.js'

// Plan 36, phase 1F: a font that came from a token (`--apx-font-family`,
// Ignite UI's `--ig-font-family`) may not be in place when the labels are
// measured, so the chart starts its load with `document.fonts.load()` and
// reads its tokens again once that settles. Once per font, only while the
// font is not loaded, and never for a font the page passed.

/** @type {ReturnType<typeof igniteSheet> | null} */
let page = null

afterEach(() => {
  page?.restore()
  page = null
  delete /** @type {any} */ (document).fonts
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

/**
 * A `document.fonts` whose `load()` the test settles, or fails.
 * @param {{status?: string, loaded?: boolean, check?: () => boolean}} [opts]
 */
function fontSet({ status = 'loaded', loaded = false, check } = {}) {
  /** @type {(ok: boolean) => void} */
  let settle = () => {}
  const loading = new Promise((resolve, reject) => {
    settle = (ok) => (ok ? resolve([]) : reject(new Error('network')))
  })
  const set = {
    status,
    // settled already, as it is before the first label asks for the font
    ready: Promise.resolve(),
    check: vi.fn(check || (() => loaded)),
    load: vi.fn(() => loading),
    settle: async (ok = true) => {
      settle(ok)
      await new Promise((r) => setTimeout(r, 0))
    },
  }
  Object.defineProperty(document, 'fonts', { configurable: true, value: set })
  return set
}

/** @param {Record<string, any>} [options] */
async function chartWith(options = {}) {
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

const FONT = 'Titillium Web, sans-serif'

describe('a token font re-reads the tokens once it has loaded (1F)', () => {
  it('--apx-font-family not loaded: one refresh, after its load', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const fonts = fontSet()
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    expect(chart.w.config.chart.fontFamily).toBe(FONT)
    expect(fonts.check).toHaveBeenCalledWith(`1em ${FONT}`)
    expect(fonts.load).toHaveBeenCalledWith(`1em ${FONT}`)
    // fonts.ready had settled before the load began: not what is waited on
    await new Promise((r) => setTimeout(r, 0))
    expect(refresh).not.toHaveBeenCalled()
    await fonts.settle()
    expect(refresh).toHaveBeenCalledTimes(1)
    // the refresh's own render does not arm it again
    await chart.refreshTokens()
    await fonts.settle()
    expect(refresh).toHaveBeenCalledTimes(2)
    chart.destroy()
  })

  it('Ignite UI font not loaded: the same', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const fonts = fontSet()
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    expect(chart.w.config.chart.fontFamily).toBe('Nunito Sans, sans-serif')
    await fonts.settle()
    expect(refresh).toHaveBeenCalledTimes(1)
    chart.destroy()
  })

  it('other fonts loading on the page cost no refresh once this one is in', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const fonts = fontSet({ status: 'loading', loaded: true })
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    await fonts.settle()
    expect(fonts.load).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('a font that fails to load keeps the fallback, with no refresh', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const fonts = fontSet()
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    await fonts.settle(false)
    expect(refresh).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('a new token font arms it again, once', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    let fonts = fontSet()
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    await fonts.settle()
    expect(refresh).toHaveBeenCalledTimes(1)
    page.apx['--apx-font-family'] = 'Inter, sans-serif'
    fonts = fontSet()
    await chart.refreshTokens()
    expect(chart.w.config.chart.fontFamily).toBe('Inter, sans-serif')
    await fonts.settle()
    expect(refresh).toHaveBeenCalledTimes(3)
    chart.destroy()
  })
})

describe('the guard (1F)', () => {
  it('never for a font the page passed, its token value included', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const fonts = fontSet()
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith({ chart: { fontFamily: FONT } })
    await fonts.settle()
    expect(fonts.check).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('never for the built-in font', async () => {
    page = igniteSheet()
    const fonts = fontSet()
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    await fonts.settle()
    expect(fonts.check).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('never when the font is already in place', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const fonts = fontSet({ loaded: true })
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    await fonts.settle()
    expect(refresh).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('never when the family list cannot be checked', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const fonts = fontSet({
      check: () => {
        throw new SyntaxError('bad font')
      },
    })
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    await fonts.settle()
    expect(refresh).not.toHaveBeenCalled()
    chart.destroy()
  })

  it('never after destroy()', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const fonts = fontSet()
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    chart.destroy()
    await fonts.settle()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('without document.fonts, or with no document (SSR)', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': FONT } })
    const refresh = vi.spyOn(ApexCharts.prototype, 'refreshTokens')
    const chart = await chartWith()
    expect(chart.w.config.chart.fontFamily).toBe(FONT)
    chart.destroy()

    const fonts = fontSet()
    vi.spyOn(BrowserAPIs, 'getDocument').mockReturnValue(null)
    const chart2 = await chartWith()
    await fonts.settle()
    expect(fonts.check).not.toHaveBeenCalled()
    expect(refresh).not.toHaveBeenCalled()
    chart2.destroy()
  })
})
