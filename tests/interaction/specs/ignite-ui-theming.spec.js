/**
 * Plan 36 (1H): the chart under real Ignite UI themes.
 *
 * fixtures/ignite-ui holds the :root tokens of the eight Ignite UI 7.4.1
 * themes, and of 7.5.0-beta.0's dark material theme, which adds the surface
 * roles (overlay and its contrast). The sheet goes on the document, so in the
 * shadow runs its tokens reach the chart by inheritance, as they do in an app.
 * Every check runs with the chart in a plain div and inside an open shadow
 * root. Plan 36's acceptance criteria:
 *   - a light theme: series 1 is the primary, labels and lines are readable
 *   - a dark theme, no mode set: the chart, tooltips and menus go dark
 *   - explicit options, the chart's CSS variables, --apx-*, a named theme and
 *     an explicit palette each beat the sheet
 *   - colorBlindMode, monochrome and high contrast ignore its colours
 *   - designSystem:false and tokens:false give the built-in look back
 *   - radius factor 1 is today's radii, and --ig-radius-factor is never read
 *   - a sheet font that arrives late re-lays the labels out
 *   - JS colour state holds only hex or rgba()
 */

import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { test, expect, centreOf } from '../fixtures/shadow-mount.js'
import { wideFont } from '../helpers/test-font.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const sheet = (name) =>
  readFileSync(
    resolve(__dirname, '..', 'fixtures', 'ignite-ui', `${name}.css`),
    'utf8',
  )

const LIGHT = [
  'light-material',
  'light-bootstrap',
  'light-fluent',
  'light-indigo',
]
const DARK = ['dark-material', 'dark-bootstrap', 'dark-fluent', 'dark-indigo']
// 7.5.0-beta.0: the only sheet with overlay roles
const NEXT = 'next-dark-material'
const ROOTS = ['light', 'shadow']
const FAMILIES = ['primary', 'secondary', 'info', 'success', 'warn', 'error']
const TRANSPARENT = 'rgba(0, 0, 0, 0)'

const CHART = (o = {}, count = 6) => ({
  series: Array.from({ length: count }, (_, i) => ({
    name: `S${i + 1}`,
    data: [10 + i, 20 + i, 15 + i, 25 + i],
  })),
  xaxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4'] },
  dataLabels: { enabled: false },
  ...o,
  chart: { type: 'bar', contextMenu: { enabled: true }, ...(o.chart || {}) },
})

/** The page, the add-ons this suite uses, and the in-page helpers. */
async function open(page, setup) {
  await setup(['context-menu'])
  await page.evaluate(() => {
    const ctx = document
      .createElement('canvas')
      .getContext('2d', { willReadFrequently: true })
    const hex = (n) => n.toString(16).padStart(2, '0')
    // Any CSS colour, as the canvas paints it (clipped to sRGB): '#rrggbb', or
    // rgba() when it is not opaque.
    window.__px = (css) => {
      if (!css) return css
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return a === 255
        ? `#${hex(r)}${hex(g)}${hex(b)}`
        : `rgba(${r}, ${g}, ${b}, ${a})`
    }
    // A colour's RGB, alpha dropped (bar fills carry the fill opacity).
    window.__rgb = (css) => {
      ctx.fillStyle = '#000'
      ctx.fillStyle = css
      const m = /^rgba\((\d+), (\d+), (\d+)/.exec(ctx.fillStyle)
      return m ? `#${hex(+m[1])}${hex(+m[2])}${hex(+m[3])}` : ctx.fillStyle
    }
    // A custom property's colour as seen from `parent`, through a probe.
    window.__var = (name, parent = document.body) => {
      const i = document.createElement('i')
      i.style.color = `var(${name}, rgba(0, 0, 0, 0))`
      parent.appendChild(i)
      const c = getComputedStyle(i).color
      i.remove()
      return window.__px(c)
    }
    const lum = (h) => {
      const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      const l = c.map((v) =>
        v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
      )
      return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]
    }
    window.__lum = (css) => lum(window.__px(css))
    window.__contrast = (a, b) => {
      const [x, y] = [window.__lum(a), window.__lum(b)].sort((p, q) => q - p)
      return (x + 0.05) / (y + 0.05)
    }
    window.__sheet = (css) => {
      document.getElementById('ig-sheet')?.remove()
      if (!css) return
      const s = document.createElement('style')
      s.id = 'ig-sheet'
      s.textContent = css
      document.head.appendChild(s)
    }
    // A page stylesheet next to the chart's own, after it: the document in
    // the light run, the chart's shadow root in the shadow run.
    window.__pageStyle = (css) => {
      const s = document.createElement('style')
      s.className = 'page-style'
      s.textContent = css
      const root = window.chartRoot
      ;(root instanceof ShadowRoot ? root : document.head).appendChild(s)
    }
    // What the chart looks like: colours, text, paper and every overlay, as
    // computed styles. The context menu and the ink card are probed with an
    // element of their class where they are mounted.
    window.__look = () => {
      const w = window.chart.w
      const wrap = w.dom.elWrap
      const q = (s) => wrap.querySelector(s)
      const cs = (n, props) => {
        if (!n) return null
        const st = getComputedStyle(n)
        return props
          .map((p) => (/color/i.test(p) ? window.__px(st[p]) : st[p]))
          .join(' | ')
      }
      const probe = (parent, cls, props) => {
        if (!parent) return null
        const d = document.createElement('div')
        d.className = cls
        parent.appendChild(d)
        const v = cs(d, props)
        d.remove()
        return v
      }
      const label = q('.apexcharts-xaxis-label')
      const box = ['backgroundColor', 'color', 'borderTopColor']
      return {
        mode: w.config.theme.mode,
        // less the per-chart id class
        classes: wrap.className
          .split(/\s+/)
          .filter((c) => !/^apexcharts[a-z0-9]{6,}$/.test(c))
          .sort()
          .join(' '),
        colors: w.globals.colors.map(window.__px).join(),
        fills: [
          ...wrap.querySelectorAll('.apexcharts-series .apexcharts-bar-area'),
        ]
          .map((n) => window.__rgb(n.getAttribute('fill')))
          .join(),
        labelFill: label && window.__px(label.getAttribute('fill')),
        grid: window.__px(q('.apexcharts-gridline')?.getAttribute('stroke')),
        paper: getComputedStyle(w.dom.Paper.node).backgroundColor,
        tooltip: cs(q('.apexcharts-tooltip'), box),
        // probed: a bar chart draws no axis tooltip
        axisTooltip: probe(
          wrap,
          `apexcharts-xaxistooltip apexcharts-theme-${w.config.tooltip.theme || 'light'}`,
          box,
        ),
        menu: cs(q('.apexcharts-menu'), box),
        menuHover: window.__var('--apx-menu-hover', q('.apexcharts-menu')),
        contextMenu: probe(wrap, 'apexcharts-context-menu', [
          'backgroundColor',
          'borderTopColor',
        ]),
        contextItem: probe(wrap, 'apexcharts-context-menu-item', ['color']),
        contextHover: window.__var('--apx-menu-hover', wrap),
        inkCard: probe(wrap, 'apexcharts-ink-card', box),
        inkHover: window.__var('--apx-ink-card-hover', wrap),
        accents: [
          '--apexcharts-focus-color',
          '--apx-ink-card-accent',
          '--apx-measure-up',
          '--apx-measure-down',
          '--apx-measure-neutral',
          '--apx-measure-guide',
        ]
          .map((v) => window.__var(v, wrap))
          .join(),
        radii: [
          cs(q('.apexcharts-tooltip'), ['borderTopLeftRadius']),
          probe(wrap, 'apexcharts-xaxistooltip', ['borderTopLeftRadius']),
          cs(q('.apexcharts-toolbar'), ['borderTopLeftRadius']),
          cs(q('.apexcharts-menu'), ['borderTopLeftRadius']),
          cs(q('.apexcharts-menu-icon'), ['borderTopLeftRadius']),
          probe(q('.apexcharts-menu'), 'apexcharts-menu-item', [
            'borderTopLeftRadius',
          ]),
          probe(wrap, 'apexcharts-context-menu', ['borderTopLeftRadius']),
          probe(wrap, 'apexcharts-context-menu-item', ['borderTopLeftRadius']),
          probe(wrap, 'apexcharts-ink-card', ['borderTopLeftRadius']),
        ].join(),
        fonts: {
          label: label && label.getAttribute('font-family'),
          tooltip: cs(q('.apexcharts-tooltip'), ['fontFamily']),
          contextMenu: probe(wrap, 'apexcharts-context-menu', ['fontFamily']),
        },
      }
    }
  })
}

const mount = (page, root, options) =>
  page.evaluate(
    async ({ root, options }) => {
      window.chart?.destroy()
      document.getElementById('mount').innerHTML = ''
      await window.__mount(root, options)
    },
    { root, options },
  )

const look = (page) => page.evaluate(() => window.__look())
const setSheet = (page, css) => page.evaluate((css) => window.__sheet(css), css)
const tokens = (page, names) =>
  page.evaluate((names) => names.map((n) => window.__var(n)), names)

/** Same colour within one step per channel (the reader and the canvas round apart). */
function near(a, b) {
  if (a === b) return true
  if (!/^#[0-9a-f]{6}$/.test(a) || !/^#[0-9a-f]{6}$/.test(b)) return false
  return [1, 3, 5].every(
    (i) =>
      Math.abs(
        parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16),
      ) <= 1,
  )
}

for (const root of ROOTS) {
  test.describe(`[${root}] Ignite UI theming`, () => {
    for (const name of LIGHT) {
      test(`${name}: series follow the families, text and lines are readable`, async ({
        page,
        setup,
      }) => {
        await open(page, setup)
        await setSheet(page, sheet(name))
        await mount(page, root, CHART())
        const seeds = await tokens(
          page,
          FAMILIES.map((f) => `--ig-${f}-seed`),
        )
        const [fore, grid, surface] = await tokens(page, [
          '--ig-gray-800',
          '--ig-gray-300',
          '--ig-surface-500',
        ])
        const l = await look(page)
        expect(l.colors.split(',').slice(0, 6)).toEqual(seeds)
        expect(l.fills.split(',')[0]).toBe(seeds[0])
        expect(l.mode).not.toBe('dark')
        expect(l.classes).toContain(
          'apexcharts-igniteui apexcharts-igniteui-light',
        )
        expect(l.labelFill).toBe(fore)
        expect(l.grid).toBe(grid)
        expect(l.paper).toBe(TRANSPARENT)
        const contrast = await page.evaluate(
          ([f, s]) =>
            Math.min(window.__contrast(f, '#ffffff'), window.__contrast(f, s)),
          [fore, surface],
        )
        expect(contrast).toBeGreaterThanOrEqual(4.5)
      })
    }

    for (const name of [...DARK, NEXT]) {
      test(`${name}: no mode set, the chart, tooltips and menus go dark`, async ({
        page,
        setup,
      }) => {
        await open(page, setup)
        await setSheet(page, sheet(name))
        await mount(page, root, CHART())
        const [primary, fore, surface] = await tokens(page, [
          '--ig-primary-seed',
          '--ig-gray-800',
          '--ig-surface-500',
        ])
        const l = await look(page)
        expect(l.mode).toBe('dark')
        expect(l.classes).toContain(
          'apexcharts-igniteui apexcharts-igniteui-dark',
        )
        expect(l.classes).toContain('apexcharts-theme-dark')
        expect(l.colors.split(',')[0]).toBe(primary)
        expect(l.labelFill).toBe(fore)
        // D6b: a dark mode from the sheet leaves the page's surface showing
        expect(l.paper).toBe(TRANSPARENT)
        expect(
          await page.evaluate(
            ([f, s]) => window.__contrast(f, s),
            [fore, surface],
          ),
        ).toBeGreaterThanOrEqual(4.5)
        // the focus ring keeps the dark rule's yellow: a primary seed can fall
        // below the 3:1 a focus indicator needs on the dark surface
        const focus = await page.evaluate(() =>
          window.__var('--apexcharts-focus-color', window.chart.w.dom.elWrap),
        )
        expect(focus).toBe('#ffd500')
        expect(
          await page.evaluate(
            ([f, s]) => window.__contrast(f, s),
            [focus, surface],
          ),
        ).toBeGreaterThanOrEqual(3)

        const dark = (box) => {
          const [bg, fg] = box.split(' | ')
          return page.evaluate(
            ([bg, fg]) => [window.__lum(bg), window.__lum(fg)],
            [bg, fg],
          )
        }

        // the tooltip, opened from the keyboard
        await page.evaluate(() => window.chart.w.dom.Paper.node.focus())
        await page.keyboard.press('ArrowRight')
        await page.waitForFunction(
          () =>
            !!window.chartRoot.querySelector(
              '.apexcharts-tooltip.apexcharts-active',
            ),
        )
        const tip = await page.evaluate(() => {
          const t = window.chartRoot.querySelector('.apexcharts-tooltip')
          const st = getComputedStyle(t)
          return `${window.__px(st.backgroundColor)} | ${window.__px(st.color)}`
        })
        let [bg, fg] = await dark(tip)
        expect(bg).toBeLessThan(0.05)
        expect(fg).toBeGreaterThan(0.5)
        ;[bg, fg] = await dark(l.axisTooltip)
        expect(bg).toBeLessThan(0.05)
        expect(fg).toBeGreaterThan(0.5)
        await page.keyboard.press('Escape')

        // the export menu, opened
        const icon = await centreOf(page, '.apexcharts-menu-icon')
        await page.mouse.click(icon.x, icon.y)
        await page.waitForFunction(
          () =>
            !!window.chartRoot.querySelector(
              '.apexcharts-menu.apexcharts-menu-open',
            ),
        )
        ;[bg, fg] = await dark((await look(page)).menu)
        expect(bg).toBeLessThan(0.05)
        expect(fg).toBeGreaterThan(0.5)
        await page.mouse.click(5, 5)

        // the context menu, opened
        const g = await centreOf(page, '.apexcharts-grid')
        await page.evaluate((g) => {
          window.chart.w.dom.Paper.node.dispatchEvent(
            new MouseEvent('contextmenu', {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: g.x,
              clientY: g.y,
              button: 2,
            }),
          )
        }, g)
        const menu = await page.evaluate(() => {
          const m = window.chartRoot.querySelector('.apexcharts-context-menu')
          const item = m && m.querySelector('.apexcharts-context-menu-item')
          return (
            m &&
            `${window.__px(getComputedStyle(m).backgroundColor)} | ${window.__px(getComputedStyle(item).color)}`
          )
        })
        expect(menu).not.toBeNull()
        ;[bg, fg] = await dark(menu)
        if (name === NEXT) {
          // drawn from the sheet's overlay roles, as is the ink card
          expect(bg).toBeLessThan(0.05)
          expect(fg).toBeGreaterThan(0.5)
          ;[bg, fg] = await dark(l.inkCard)
          expect(bg).toBeLessThan(0.05)
          expect(fg).toBeGreaterThan(0.5)
        } else {
          // 7.4.1 has no overlay roles, and the context menu and the ink card
          // have no dark style of their own: both keep the built-in light look
          expect(menu).toBe('#ffffff | #1e293b')
          expect(l.inkCard).toBe('#ffffff | #1e293b | #e2e8f0')
        }
      })
    }

    test.describe('each higher layer beats the sheet', () => {
      test('explicit options, the default values included', async ({
        page,
        setup,
      }) => {
        await open(page, setup)
        await setSheet(page, sheet('light-indigo'))
        await mount(
          page,
          root,
          CHART({
            colors: ['#123456', '#234567'],
            chart: {
              foreColor: '#373d3f',
              fontFamily: 'Helvetica, Arial, sans-serif',
            },
            grid: { borderColor: '#e0e0e0' },
          }),
        )
        const l = await look(page)
        expect(l.colors.split(',').slice(0, 2)).toEqual(['#123456', '#234567'])
        expect(l.labelFill).toBe('#373d3f')
        expect(l.grid).toBe('#e0e0e0')
        expect(l.fonts.label).toBe('Helvetica, Arial, sans-serif')

        // an explicit mode beats the variant of a dark sheet
        await setSheet(page, sheet('dark-indigo'))
        await mount(page, root, CHART({ theme: { mode: 'light' } }))
        const d = await look(page)
        expect(d.mode).toBe('light')
        expect(d.classes).not.toContain('apexcharts-theme-dark')
      })

      test("the chart's own CSS variables", async ({ page, setup }) => {
        await open(page, setup)
        await setSheet(page, sheet(NEXT))
        await mount(page, root, CHART())
        // A page styling a dark chart matches the chart's own dark rules;
        // the twins add no specificity, so the page wins by coming later.
        await page.evaluate(() =>
          window.__pageStyle(`
            .apexcharts-tooltip.apexcharts-theme-dark { --apx-tt-bg: rgb(1, 2, 3); }
            .apexcharts-theme-dark .apexcharts-menu { --apx-menu-bg: rgb(4, 5, 6); }
            .apexcharts-theme-dark.apexcharts-canvas {
              --apx-menu-bg: rgb(7, 8, 9);
              --apx-ink-card-bg: rgb(10, 11, 12);
              --apexcharts-focus-color: rgb(13, 14, 15);
              --apx-measure-up: rgb(16, 17, 18);
            }`),
        )
        const l = await look(page)
        expect(l.tooltip.split(' | ')[0]).toBe('#010203')
        expect(l.menu.split(' | ')[0]).toBe('#040506')
        expect(l.contextMenu.split(' | ')[0]).toBe('#070809')
        expect(l.inkCard.split(' | ')[0]).toBe('#0a0b0c')
        expect(l.accents.split(',').slice(0, 3)).toEqual([
          '#0d0e0f',
          '#0099ff',
          '#101112',
        ])
      })

      test('--apx-* tokens', async ({ page, setup }) => {
        await open(page, setup)
        const ig = sheet('light-indigo')
        await setSheet(
          page,
          `${ig}\n:root { --apx-fore: #112233; --apx-grid: #445566; --apx-font-family: Georgia, serif; --apx-accent: #ff0000; }`,
        )
        await mount(page, root, CHART())
        const seeds = await tokens(
          page,
          FAMILIES.map((f) => `--ig-${f}-seed`),
        )
        const l = await look(page)
        expect(l.labelFill).toBe('#112233')
        expect(l.grid).toBe('#445566')
        expect(l.fonts.label).toBe('Georgia, serif')
        // the accent takes row 1, the sheet fills the rest
        expect(l.colors.split(',').slice(0, 6)).toEqual([
          '#ff0000',
          ...seeds.slice(1),
        ])

        // a token series list is taken whole: no row from the sheet
        await setSheet(
          page,
          `${ig}\n:root { --apx-series-1: #aa0000; --apx-series-2: #00aa00; --apx-series-3: #0000aa; }`,
        )
        await mount(page, root, CHART())
        const s = (await look(page)).colors.split(',')
        expect(s.slice(0, 3)).toEqual(['#aa0000', '#00aa00', '#0000aa'])
        for (const c of s) expect(seeds).not.toContain(c)
      })

      test('a named theme and an explicit palette', async ({ page, setup }) => {
        await open(page, setup)
        await page.evaluate(() =>
          window.ApexCharts.registerTheme('ig-1h-brand', {
            palette: ['#aa1111', '#11aa11', '#1111aa'],
            tokens: {
              fore: '#101010',
              grid: '#202020',
              font: 'Courier New, monospace',
            },
          }),
        )
        await setSheet(page, sheet('light-indigo'))
        await mount(page, root, CHART({ theme: { name: 'ig-1h-brand' } }))
        const n = await look(page)
        expect(n.colors.split(',').slice(0, 3)).toEqual([
          '#aa1111',
          '#11aa11',
          '#1111aa',
        ])
        expect(n.labelFill).toBe('#101010')
        expect(n.grid).toBe('#202020')
        expect(n.fonts.label).toBe('Courier New, monospace')

        await setSheet(page, null)
        await mount(page, root, CHART({ theme: { palette: 'palette3' } }))
        const builtIn = (await look(page)).colors
        await setSheet(page, sheet('light-indigo'))
        await mount(page, root, CHART({ theme: { palette: 'palette3' } }))
        expect((await look(page)).colors).toBe(builtIn)
      })
    })

    for (const [label, theme] of [
      ['colorBlindMode', { accessibility: { colorBlindMode: 'deuteranopia' } }],
      ['high contrast', { accessibility: { colorBlindMode: 'highContrast' } }],
      ['monochrome', { monochrome: { enabled: true } }],
    ]) {
      test(`${label} looks the same with or without the sheet`, async ({
        page,
        setup,
      }) => {
        await open(page, setup)
        // The font is left out: the sheet's font still applies to the chart's
        // text under these modes, an open decision in plan 36.
        const strip = ({ fonts: _fonts, ...rest }) => rest
        await mount(page, root, CHART({ theme }))
        const without = strip(await look(page))
        await setSheet(page, sheet('light-indigo'))
        await mount(page, root, CHART({ theme }))
        expect(strip(await look(page))).toEqual(without)

        // A dark sheet still sets the mode (D6): the same as asking for dark,
        // but for the paper, which a mode from the sheet leaves transparent.
        await setSheet(page, null)
        await mount(page, root, CHART({ theme: { ...theme, mode: 'dark' } }))
        const { paper: _p, ...darkWithout } = strip(await look(page))
        for (const name of ['dark-indigo', NEXT]) {
          await setSheet(page, sheet(name))
          await mount(page, root, CHART({ theme }))
          const { paper, ...dark } = strip(await look(page))
          expect(dark, name).toEqual(darkWithout)
          expect(paper).toBe(TRANSPARENT)
        }
      })
    }

    test('designSystem:false and tokens:false give the built-in look back', async ({
      page,
      setup,
    }) => {
      await open(page, setup)
      await mount(page, root, CHART())
      const builtIn = await look(page)
      for (const name of ['light-indigo', 'dark-indigo', NEXT]) {
        await setSheet(page, sheet(name))
        for (const off of [{ designSystem: false }, { tokens: false }]) {
          await mount(page, root, CHART({ theme: off }))
          expect(await look(page), `${name} ${JSON.stringify(off)}`).toEqual(
            builtIn,
          )
        }
      }
    })

    test('radius factor 1 is today, and --ig-radius-factor is never read', async ({
      page,
      setup,
    }) => {
      await open(page, setup)
      await mount(page, root, CHART())
      const radii = (await look(page)).radii
      // the px in apexcharts.css before the factor: tooltip, axis tooltip,
      // toolbar, export menu, menu icon, menu item, context menu and item,
      // ink card
      expect(radii).toBe('8px,6px,8px,8px,5px,5px,8px,5px,8px')
      await setSheet(page, ':root { --apx-radius-factor: 1; }')
      await mount(page, root, CHART())
      expect((await look(page)).radii).toBe(radii)
      await setSheet(
        page,
        `${sheet('light-indigo')}\n:root { --ig-radius-factor: 0.25; }`,
      )
      await mount(page, root, CHART())
      expect((await look(page)).radii).toBe(radii)
      expect(
        await page.evaluate(() => window.chart.w.globals.radiusFactor),
      ).toBe(1)
    })

    test('a sheet font that loads after the render re-lays out the labels', async ({
      page,
      setup,
    }) => {
      // The font is held back until the chart has rendered with the fallback.
      let release
      const held = new Promise((r) => (release = r))
      await page.route('https://apexcharts.test/**', async (route) => {
        await held
        await route.fulfill({ body: wideFont(), contentType: 'font/ttf' })
      })
      await open(page, setup)
      await setSheet(
        page,
        `${sheet('light-indigo')}
        @font-face { font-family: ApexWideTest; src: url(https://apexcharts.test/wide.ttf) format('truetype'); }
        :root { --ig-font-family: ApexWideTest, sans-serif; }`,
      )
      await mount(
        page,
        root,
        CHART({
          series: [{ name: 'S1', data: [120000, 240000, 180000, 300000] }],
        }),
      )
      const layout = () =>
        page.evaluate(() => {
          const wrap = window.chart.w.dom.elWrap
          const rect = (n) => n.getBoundingClientRect()
          const grid = rect(wrap.querySelector('.apexcharts-grid'))
          const svg = rect(window.chart.w.dom.Paper.node)
          const ys = [...wrap.querySelectorAll('.apexcharts-yaxis-label')].map(
            rect,
          )
          const xs = [...wrap.querySelectorAll('.apexcharts-xaxis-label')].map(
            rect,
          )
          const overlap = xs.some((a, i) =>
            xs.some(
              (b, j) =>
                j > i &&
                a.right > b.left &&
                b.right > a.left &&
                a.bottom > b.top &&
                b.bottom > a.top,
            ),
          )
          return {
            status: document.fonts.status,
            font: window.chart.w.config.chart.fontFamily,
            yInside: ys.every(
              (r) => r.left >= svg.left - 1 && r.right <= grid.left + 1,
            ),
            yWidest: Math.max(...ys.map((r) => r.width)),
            xOverlap: overlap,
          }
        })
      const before = await layout()
      expect(before.font).toBe('ApexWideTest, sans-serif')
      expect(before.status).toBe('loading')
      release()
      await page.evaluate(() => document.fonts.ready)
      await page
        .waitForFunction(
          () => {
            const wrap = window.chart.w.dom.elWrap
            const grid = wrap
              .querySelector('.apexcharts-grid')
              .getBoundingClientRect()
            const ys = [...wrap.querySelectorAll('.apexcharts-yaxis-label')]
            return (
              ys.length &&
              ys.every((n) => n.getBoundingClientRect().right <= grid.left + 1)
            )
          },
          null,
          { timeout: 3000 },
        )
        .catch(() => {})
      const after = await layout()
      expect(after.status).toBe('loaded')
      // set in the wide face now, and laid out for it
      expect(after.yWidest).toBeGreaterThan(before.yWidest * 1.5)
      expect(after.yInside).toBe(true)
      expect(after.xOverlap).toBe(false)
    })

    test('JS colour state holds only hex or rgba() under every sheet', async ({
      page,
      setup,
    }) => {
      await open(page, setup)
      const ok =
        /^(#[0-9a-f]{6}|rgba\(\d{1,3}, \d{1,3}, \d{1,3}, (0|1|0?\.\d+)\))$/i
      for (const name of [...LIGHT, ...DARK, NEXT]) {
        await setSheet(page, sheet(name))
        await mount(page, root, CHART({}, 18))
        const state = await page.evaluate(() => {
          const { config: c, globals: g } = window.chart.w
          return {
            colors: g.colors,
            fill: g.fill?.colors || [],
            stroke: g.stroke?.colors || [],
            chrome: [
              c.chart.foreColor,
              c.grid.borderColor,
              c.xaxis.axisBorder.color,
              c.xaxis.axisTicks.color,
            ],
          }
        })
        expect(state.colors).toHaveLength(18)
        for (const v of [
          ...state.colors,
          ...state.fill,
          ...state.stroke,
          ...state.chrome,
        ]) {
          if (typeof v === 'string') expect(v, name).toMatch(ok)
        }
        // rows 7 to 12 are the families at 300, 13 to 18 at 700
        const rows = await tokens(page, [
          ...FAMILIES.map((f) => `--ig-${f}-300`),
          ...FAMILIES.map((f) => `--ig-${f}-700`),
        ])
        const got = await page.evaluate(
          (c) => c.map(window.__px),
          state.colors.slice(6),
        )
        got.forEach((c, i) =>
          expect(
            near(c, rows[i]),
            `${name} row ${i + 7}: ${c} vs ${rows[i]}`,
          ).toBe(true),
        )
      }
    })
  })
}
