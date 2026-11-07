import { describe, it, expect, beforeAll, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import { igniteSheet } from './utils/ignite-ui-sheet.js'

// Plan 36 on a trellis. The host draws no chart and runs no Theme, but its
// panels do, so whatever the host pushes into a panel, and whatever the host
// draws around the panels, must agree with what each panel's Theme resolved:
// - the y-axis colours a gutter push hands back are the theme's, not the
//   page's, so they keep following the token (D5: "explicit" is what the page
//   passed);
// - the headers, legend and title take the panels' token font;
// - `theme.tokens: false` resets the radius factor on the host's wrap too.

const DEFAULT_FONT = 'Helvetica, Arial, sans-serif'
const NAMES = ['trellisFont']

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})

/** @type {ReturnType<typeof igniteSheet> | null} */
let page = null

afterEach(() => {
  page?.restore()
  page = null
  NAMES.forEach((n) => ApexCharts.unregisterTheme(n))
  window.Apex = {}
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const mk = (k) =>
  Array.from({ length: 4 }, (_, i) => ({ x: 'c' + i, y: i * 3 + k }))

/** @param {Record<string, any>} [opts] */
async function host(opts = {}) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    ...opts,
    chart: { type: 'line', animations: { enabled: false }, ...opts.chart },
    series: [
      { name: 'U', region: 'North', data: mk(1) },
      { name: 'U', region: 'South', data: mk(20) },
    ],
    trellis: { by: 'region', columns: 2, scales: { y: 'independent' } },
  })
  await chart.render()
  return chart
}

/** @param {any} chart */
const panels = (chart) =>
  chart.getPanels().filter((/** @type {any} */ p) => p.chart)

/** @param {any} panel the y axis's border and tick colours */
const yColors = (panel) => {
  const y = panel.chart.w.config.yaxis[0]
  return [y.axisBorder.color, y.axisTicks.color]
}

const Y_SHOWN = {
  yaxis: { axisBorder: { show: true }, axisTicks: { show: true } },
}

describe('trellis: library pushes do not count as the page naming a colour', () => {
  it('the y axes keep following --apx-grid after the gutter push', async () => {
    page = igniteSheet({ apx: { '--apx-grid': '#111111' } })
    const chart = await host(Y_SHOWN)
    const ps = panels(chart)
    expect(ps.length).toBe(2)
    // the independent-y gutter pass ran on mount; one more push, as a
    // virtualized mount or a wider label makes
    expect(typeof chart.trellis.virtual._gutterFloor).toBe('number')
    await chart.trellis._pushGutterFloor(12)
    for (const p of ps) {
      expect(p.chart.w.config.yaxis[0].labels.minWidth).toBe(12)
      expect(p.chart.w.globals.themeGridColorsExplicit.yaxis).toEqual([
        { border: false, ticks: false },
      ])
      expect(yColors(p)).toEqual(['#111111', '#111111'])
    }
    page.apx['--apx-grid'] = '#222222'
    for (const p of ps) {
      await p.chart.refreshTokens()
      expect(p.chart.w.config.grid.borderColor).toBe('#222222')
      expect(yColors(p)).toEqual(['#222222', '#222222'])
    }
    chart.destroy()
  })

  it("a y-axis colour the page named stays the page's through the push", async () => {
    page = igniteSheet({ apx: { '--apx-grid': '#111111' } })
    const chart = await host({
      yaxis: {
        axisBorder: { show: true, color: '#e0e0e0' },
        axisTicks: { show: true },
      },
    })
    page.apx['--apx-grid'] = '#222222'
    for (const p of panels(chart)) {
      expect(p.chart.w.globals.themeGridColorsExplicit.yaxis).toEqual([
        { border: true, ticks: false },
      ])
      await p.chart.refreshTokens()
      expect(yColors(p)).toEqual(['#e0e0e0', '#222222'])
    }
    chart.destroy()
  })
})

describe('trellis: the host wrap matches its panels', () => {
  /** @param {any} chart */
  const fonts = (chart) => ({
    host: chart.trellis.elWrap.style.fontFamily,
    panels: [
      ...new Set(panels(chart).map((p) => p.chart.w.config.chart.fontFamily)),
    ],
  })

  it('takes --apx-font-family where the page named no font', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': 'Georgia, serif' } })
    const chart = await host()
    expect(fonts(chart)).toEqual({
      host: 'Georgia, serif',
      panels: ['Georgia, serif'],
    })
    chart.destroy()
  })

  it("takes a named theme's tokens.font, and the design system's", async () => {
    page = igniteSheet()
    ApexCharts.registerTheme('trellisFont', { tokens: { font: 'Verdana' } })
    const named = await host({ theme: { name: 'trellisFont' } })
    expect(fonts(named)).toEqual({ host: 'Verdana', panels: ['Verdana'] })
    named.destroy()

    page.use('light/indigo')
    page.vars['--ig-font-family'] = 'Roboto, sans-serif'
    const ds = await host()
    expect(fonts(ds)).toEqual({
      host: 'Roboto, sans-serif',
      panels: ['Roboto, sans-serif'],
    })
    ds.destroy()
  })

  it('keeps a font the page named, the default included, and the default without tokens', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': 'Georgia, serif' } })
    const own = await host({ chart: { fontFamily: DEFAULT_FONT } })
    expect(fonts(own)).toEqual({ host: DEFAULT_FONT, panels: [DEFAULT_FONT] })
    own.destroy()

    page.apx = {}
    const plain = await host()
    expect(fonts(plain)).toEqual({ host: DEFAULT_FONT, panels: [DEFAULT_FONT] })
    plain.destroy()
  })

  it("a font passed later through the host is the page's", async () => {
    page = igniteSheet({ apx: { '--apx-font-family': 'Georgia, serif' } })
    const chart = await host()
    await chart.updateOptions({ chart: { fontFamily: 'Verdana' } })
    expect(fonts(chart)).toEqual({ host: 'Verdana', panels: ['Verdana'] })
    chart.destroy()
  })

  it('theme.tokens:false resets the radius factor on the host wrap and skips the token font', async () => {
    page = igniteSheet({ apx: { '--apx-font-family': 'Georgia, serif' } })
    const chart = await host({ theme: { tokens: false } })
    const style = chart.trellis.elWrap.style
    expect(style.getPropertyValue('--apx-radius-factor')).toBe('initial')
    expect(fonts(chart)).toEqual({ host: DEFAULT_FONT, panels: [DEFAULT_FONT] })
    chart.destroy()
  })

  it('writes no reset with tokens on', async () => {
    page = igniteSheet()
    const chart = await host()
    const style = chart.trellis.elWrap.style
    expect(style.getPropertyValue('--apx-radius-factor')).toBe('')
    chart.destroy()
  })
})
