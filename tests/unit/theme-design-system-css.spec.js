import fs from 'fs'
import path from 'path'
import { describe, it, expect, afterEach, vi } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/measure.js'
import { igniteSheet } from './utils/ignite-ui-sheet.js'

// Plan 36, phase 1D: the stylesheet maps the overlays (tooltip, axis tooltip,
// both menus, ink card), the measure colours and the focus colour onto
// Ignite UI through `:where(.apexcharts-igniteui)` twins. Theme.js puts the
// class on the canvas only while the design system's colours apply, with a
// variant class beside it for the D6 gate.

const CSS = fs.readFileSync(
  path.resolve(__dirname, '../../src/assets/apexcharts.css'),
  'utf8',
)

/** @type {ReturnType<typeof igniteSheet> | null} */
let page = null

afterEach(() => {
  page?.restore()
  page = null
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

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

/** @param {any} chart */
const dsClasses = (chart) =>
  [...chart.w.dom.elWrap.classList].filter((c) =>
    c.startsWith('apexcharts-igniteui'),
  )

describe('the design-system class (1D)', () => {
  it('is absent on a page without Ignite UI', async () => {
    page = igniteSheet()
    const chart = await chartWith()
    expect(dsClasses(chart)).toEqual([])
    chart.destroy()
  })

  it('goes on with the light variant class under a light sheet', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith()
    expect(dsClasses(chart)).toEqual([
      'apexcharts-igniteui',
      'apexcharts-igniteui-light',
    ])
    chart.destroy()
  })

  it('names the dark variant under a dark sheet', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith()
    expect(dsClasses(chart)).toEqual([
      'apexcharts-igniteui',
      'apexcharts-igniteui-dark',
    ])
    chart.destroy()
  })

  it('names the sheet, not the mode, when the page chose the other mode', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    const chart = await chartWith({ theme: { mode: 'light' } })
    expect(
      chart.w.dom.elWrap.classList.contains('apexcharts-theme-light'),
    ).toBe(true)
    expect(dsClasses(chart)).toContain('apexcharts-igniteui-dark')
    chart.destroy()
  })

  it('counts a sheet with no variant as light', async () => {
    page = igniteSheet({ sheet: 'dark/indigo' })
    delete page.vars['--ig-theme-variant']
    const chart = await chartWith()
    expect(dsClasses(chart)).toEqual([
      'apexcharts-igniteui',
      'apexcharts-igniteui-light',
    ])
    chart.destroy()
  })

  it.each([
    ['theme.tokens: false', { tokens: false }],
    ['theme.designSystem: false', { designSystem: false }],
    ['colorBlindMode', { accessibility: { colorBlindMode: 'deuteranopia' } }],
    ['monochrome', { monochrome: { enabled: true } }],
  ])('stays off with %s', async (_, theme) => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith({ theme })
    expect(dsClasses(chart)).toEqual([])
    chart.destroy()
  })

  it('follows the sheet across refreshTokens()', async () => {
    page = igniteSheet({ sheet: 'light/indigo' })
    const chart = await chartWith()
    expect(dsClasses(chart)).toContain('apexcharts-igniteui')
    page.use(null)
    await chart.refreshTokens()
    expect(dsClasses(chart)).toEqual([])
    page.use('light/bootstrap')
    await chart.refreshTokens()
    expect(dsClasses(chart)).toContain('apexcharts-igniteui-light')
    chart.destroy()
  })
})

describe('the measure colours under a design system (1D)', () => {
  /** @param {Record<string, string>} vars */
  const decl = (vars) =>
    /** @type {any} */ ({ getPropertyValue: (n) => vars[n] ?? '' })
  // What the stylesheet's twin computes to: the property and its -ig copy
  // hold the same token text.
  const twin = (/** @type {string} */ name, /** @type {string} */ text) => ({
    [name]: text,
    [`${name}-ig`]: text,
  })

  it("swaps the twin's token text for the colour Theme read, as hex", async () => {
    page = igniteSheet({ sheet: 'light/bootstrap' })
    const chart = await chartWith({ chart: { measure: { enabled: true } } })
    const m = chart.ctx.measure
    const ds = chart.ctx.theme.designSystem
    const cs = decl({
      // a relative colour, which jsdom (and Utils.readColor) cannot read
      ...twin('--apx-measure-up', 'hsl(from #198754 h s l)'),
      ...twin('--apx-measure-neutral', 'hsl(from #6c757d h s l)'),
    })
    expect(ds.colors.positive).toMatch(/^#[0-9a-f]{6}$/)
    expect(
      m._resolveColor(undefined, '--apx-measure-up', '#16a34a', cs, 'positive'),
    ).toBe(ds.colors.positive)
    expect(
      m._resolveColor(
        undefined,
        '--apx-measure-neutral',
        '#64748b',
        cs,
        'neutral',
      ),
    ).toBe(ds.colors.neutral)
    // an explicit colour is never rewritten
    expect(
      m._resolveColor(
        'oklch(0.6 0.1 150)',
        '--apx-measure-up',
        '#16a34a',
        cs,
        'positive',
      ),
    ).toBe('oklch(0.6 0.1 150)')
    chart.destroy()
  })

  it("uses a page's own value as written, Ignite UI sheet or not", async () => {
    for (const sheet of ['light/indigo', 'dark/indigo', null]) {
      page?.restore()
      page = igniteSheet({ sheet })
      const chart = await chartWith({ chart: { measure: { enabled: true } } })
      const m = chart.ctx.measure
      // the page's rule beats the twin's property, not its -ig copy
      const cs = decl({
        '--apx-measure-up': 'oklch(0.55 0.2 300)',
        '--apx-measure-up-ig': sheet ? '#4caf50' : '',
        '--apx-measure-down': 'lab(50 60 40)',
        '--apx-measure-neutral': 'color(display-p3 0.2 0.4 0.9)',
      })
      expect(
        m._resolveColor(
          undefined,
          '--apx-measure-up',
          '#16a34a',
          cs,
          'positive',
        ),
      ).toBe('oklch(0.55 0.2 300)')
      expect(
        m._resolveColor(
          undefined,
          '--apx-measure-down',
          '#dc2626',
          cs,
          'negative',
        ),
      ).toBe('lab(50 60 40)')
      expect(
        m._resolveColor(
          undefined,
          '--apx-measure-neutral',
          '#64748b',
          cs,
          'neutral',
        ),
      ).toBe('color(display-p3 0.2 0.4 0.9)')
      chart.destroy()
    }
  })

  it('reads the -ig copy only where the twin applies: the built-in value elsewhere', async () => {
    page = igniteSheet()
    const chart = await chartWith({ chart: { measure: { enabled: true } } })
    const m = chart.ctx.measure
    const cs = decl({ '--apx-measure-guide': '#94a3b8' })
    expect(
      m._resolveColor(undefined, '--apx-measure-guide', '#94a3b8', cs, 'guide'),
    ).toBe('#94a3b8')
    expect(m._colors()).toEqual({
      up: '#16a34a',
      down: '#dc2626',
      neutral: '#64748b',
      guide: '#94a3b8',
    })
    chart.destroy()
  })
})

// The stylesheet itself: each twin shadows, by order alone, a value a rule of
// the same specificity declares, so a page rule still beats it, and with the
// sheet's token absent it falls back to that very value.
describe('the stylesheet twins (1D)', () => {
  const rules = [
    ...CSS.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g),
  ].map(([, sel, body]) => ({
    selectors: sel
      .trim()
      .split(',')
      .map((s) => s.trim().replace(/\s+/g, ' ')),
    decls: /** @type {[string, string][]} */ (
      body
        .split(';')
        .map((d) => d.trim())
        .filter(Boolean)
        .map((d) => {
          const i = d.indexOf(':')
          return [d.slice(0, i).trim(), d.slice(i + 1).trim()]
        })
    ),
  }))
  const isTwin = (/** @type {string} */ s) => s.includes('apexcharts-igniteui')
  const twins = rules.filter((r) => r.selectors.some(isTwin))
  // `:where(...)` out, as specificity sees it
  const bare = (/** @type {string} */ s) =>
    s
      .replace(/:where\((?:[^()]|\([^()]*\))*\)/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  /** the innermost fallback of a var() chain */
  const fallback = (/** @type {string} */ v) => {
    let out = v
    let m
    while ((m = /^var\(--[\w-]+,\s*([\s\S]*)\)$/.exec(out))) out = m[1].trim()
    return out
  }

  it('has twins for every overlay, the measure and the focus colour', () => {
    expect(twins.length).toBeGreaterThan(10)
    const declared = new Set(twins.flatMap((r) => r.decls.map(([p]) => p)))
    for (const p of [
      '--apexcharts-focus-color',
      '--apx-tt-bg',
      '--apx-tt-color',
      '--apx-tt-color-muted',
      '--apx-tt-border',
      '--apx-axt-bg',
      '--apx-axt-color',
      '--apx-axt-border',
      '--apx-menu-bg',
      '--apx-menu-fg',
      '--apx-menu-border',
      '--apx-menu-hover',
      '--apx-ink-card-bg',
      '--apx-ink-card-fg',
      '--apx-ink-card-border',
      '--apx-ink-card-hover',
      '--apx-ink-card-accent',
      '--apx-measure-up',
      '--apx-measure-down',
      '--apx-measure-neutral',
      '--apx-measure-guide',
      'font-family',
    ]) {
      expect(declared, p).toContain(p)
    }
  })

  it('leaves the dark focus colour untwinned: a dark chart keeps #FFD500', () => {
    const focus = twins.filter((r) =>
      r.decls.some(([p]) => p === '--apexcharts-focus-color'),
    )
    expect(focus.length).toBe(1)
    expect(focus[0].selectors.join(',')).not.toMatch(/theme-dark/)
    const dark = rules.find((r) =>
      r.selectors.includes('.apexcharts-theme-dark.apexcharts-canvas'),
    )
    expect(dark?.decls).toContainEqual(['--apexcharts-focus-color', '#FFD500'])
  })

  it('reads --ig-* only inside a twin', () => {
    for (const r of rules) {
      if (r.decls.some(([, v]) => v.includes('--ig-'))) {
        expect(r.selectors.every(isTwin), r.selectors.join(', ')).toBe(true)
      }
    }
  })

  it('never twins a high-contrast rule or declares a family token', () => {
    for (const r of twins) {
      expect(r.selectors.join(',')).not.toMatch(/high-contrast/)
      for (const [p] of r.decls) {
        expect(p).not.toMatch(
          /^--apx-(accent|fore|grid|surface|series-\d+|font-family|radius-factor)$/,
        )
      }
    }
  })

  it('shadows an earlier rule of the same specificity, falling back to its value', () => {
    twins.forEach((twin) => {
      const at = rules.indexOf(twin)
      for (const sel of twin.selectors) {
        const base = rules
          .slice(0, at)
          .filter(
            (r) => !r.selectors.some(isTwin) && r.selectors.includes(bare(sel)),
          )
        expect(base.length, sel).toBeGreaterThan(0)
        for (const [p, v] of twin.decls) {
          if (p.endsWith('-ig')) continue
          const own = base.flatMap((r) => r.decls).filter(([q]) => q === p)
          expect(own.length, `${sel} ${p}`).toBeGreaterThan(0)
          if (p.startsWith('--')) {
            expect(fallback(v), `${sel} ${p}`).toBe(own[own.length - 1][1])
          }
        }
      }
    })
  })

  it('takes the menu and ink card font from --apx-font-family, Helvetica by default', () => {
    for (const sel of ['.apexcharts-context-menu', '.apexcharts-ink-card']) {
      const r = rules.find(
        (x) => x.selectors.length === 1 && x.selectors[0] === sel,
      )
      const font = r?.decls.find(([p]) => p === 'font-family')
      expect(font?.[1]).toBe(
        'var(--apx-font-family, Helvetica, Arial, sans-serif)',
      )
    }
    expect(CSS).not.toMatch(/font-family: Helvetica/)
  })

  it('tokenises the export menu, the toolbar and the wheel hint with the old values', () => {
    const decls = (/** @type {string} */ sel) =>
      Object.fromEntries(
        rules
          .filter((r) => r.selectors.includes(sel) && !r.selectors.some(isTwin))
          .flatMap((r) => r.decls),
      )
    expect(decls('.apexcharts-menu')).toMatchObject({
      '--apx-menu-bg': 'rgba(255, 255, 255, 0.95)',
      '--apx-menu-border': 'rgba(15, 23, 42, 0.08)',
      '--apx-menu-hover': 'rgba(15, 23, 42, 0.06)',
      background: 'var(--apx-menu-bg)',
      border: '1px solid var(--apx-menu-border)',
    })
    expect(decls('.apexcharts-theme-dark .apexcharts-menu')).toMatchObject({
      '--apx-menu-bg': 'rgba(28, 28, 31, 0.92)',
      '--apx-menu-fg': '#f3f4f6',
      background: 'var(--apx-menu-bg)',
      color: 'var(--apx-menu-fg)',
    })
    expect(decls('.apexcharts-toolbar')).toMatchObject({
      '--apx-toolbar-bg': 'rgba(255, 255, 255, 0.85)',
      background: 'var(--apx-toolbar-bg)',
    })
    expect(
      decls('.apexcharts-theme-dark .apexcharts-wheel-hint span'),
    ).toMatchObject({
      '--apx-wheel-hint-bg': 'rgba(255, 255, 255, 0.9)',
      '--apx-wheel-hint-fg': '#1c1c1f',
    })
    // no literal colour left on the menu, the toolbar or the hint
    for (const sel of [
      '.apexcharts-menu',
      '.apexcharts-toolbar',
      '.apexcharts-wheel-hint span',
      '.apexcharts-theme-dark .apexcharts-toolbar',
      '.apexcharts-theme-dark .apexcharts-wheel-hint span',
    ]) {
      const d = decls(sel)
      for (const p of ['background', 'color', 'border', 'border-color']) {
        if (d[p]) expect(d[p], `${sel} ${p}`).toMatch(/var\(--apx-/)
      }
    }
  })
})
