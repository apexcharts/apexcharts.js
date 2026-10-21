/**
 * Shadow DOM audit, Wave 1: rows C1 to C10 of plans/34-shadow-dom-audit.md.
 *
 * Every check runs the same config in the light DOM, in an open shadow root,
 * and in a nested shadow root (theme variables on the outer host). Each test
 * asserts what a user sees or gets, so a red shadow/nested case next to a green
 * light case is a shadow DOM defect. Findings: plans/34-findings-charts-dom.md.
 */

import { test, expect, MODES, centreOf } from '../fixtures/shadow-mount.js'

const XY = [
  [1, 10],
  [2, 40],
  [3, 25],
  [4, 50],
  [5, 35],
  [6, 60],
  [7, 45],
  [8, 70],
]

const lineOpts = (chart = {}, extra = {}) => ({
  chart: { type: 'line', ...chart },
  series: [{ name: 'S', data: XY }],
  xaxis: { type: 'numeric' },
  markers: { size: 4 },
  ...extra,
})

const settle = (page, ms = 350) => page.waitForTimeout(ms)

for (const mode of MODES) {
  test.describe(`[${mode}]`, () => {
    // C1: ContextMenu._onDocDown reads the retargeted target, so a mousedown
    // on a menu item looks like an outside press and closes the menu first.
    test('C1 context menu item runs when clicked', async ({ page, setup }) => {
      await setup(['context-menu'])
      await page.evaluate(async (mode) => {
        window.__ran = 0
        await window.__mount(mode, {
          chart: {
            type: 'line',
            contextMenu: {
              enabled: true,
              items: [{ id: 'probe', label: 'Probe', onClick: () => window.__ran++ }],
            },
          },
          series: [{ name: 'S', data: [[1, 10], [2, 40], [3, 25], [4, 50]] }],
          xaxis: { type: 'numeric' },
        })
      }, mode)
      const plot = await centreOf(page, '.apexcharts-grid')
      await page.mouse.click(plot.x, plot.y, { button: 'right' })
      const item = await centreOf(page, '.apexcharts-context-menu-item')
      expect(item, 'menu did not open').not.toBeNull()
      await page.mouse.click(item.x, item.y)
      expect(await page.evaluate(() => window.__ran)).toBe(1)
    })

    // C2: History reads document.activeElement and a retargeted pointerdown.
    test('C2a undo key works after clicking the chart', async ({ page, setup }) => {
      await setup(['history'])
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        { mode, opts: lineOpts({ history: { enabled: true, coalesceMs: 20 } }) },
      )
      await settle(page)
      await page.evaluate(() =>
        window.chart.updateSeries([{ name: 'S', data: [[1, 99], [2, 99], [3, 99]] }]),
      )
      await settle(page)
      const plot = await centreOf(page, '.apexcharts-grid')
      await page.mouse.click(plot.x, plot.y)
      await page.keyboard.press('Control+z')
      await settle(page)
      expect(
        await page.evaluate(() => window.chart.w.config.series[0].data[0][1]),
      ).toBe(10)
    })

    test('C2b undo key works with focus inside the chart', async ({ page, setup }) => {
      await setup(['history'])
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        { mode, opts: lineOpts({ history: { enabled: true, coalesceMs: 20 } }) },
      )
      await settle(page)
      await page.evaluate(() =>
        window.chart.updateSeries([{ name: 'S', data: [[1, 99], [2, 99], [3, 99]] }]),
      )
      await settle(page)
      await page.evaluate(() => window.chart.w.dom.Paper.node.focus())
      await page.keyboard.press('Control+z')
      await settle(page)
      expect(
        await page.evaluate(() => window.chart.w.config.series[0].data[0][1]),
      ).toBe(10)
    })

    // C3: the ink editor closes on any press its document listener thinks is
    // outside the card.
    test('C3 ink editor survives a click on its own Bold button', async ({
      page,
      setup,
    }) => {
      await setup(['ink'])
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        { mode, opts: lineOpts({ ink: { enabled: true } }) },
      )
      await page.evaluate(() => window.chart.ink.createAt(4, 30, { text: 'Note' }))
      await settle(page, 150)
      const bold = await centreOf(page, '.apexcharts-ink-btn--bold')
      expect(bold, 'editor card did not open').not.toBeNull()
      await page.mouse.click(bold.x, bold.y)
      await settle(page, 150)
      const state = await page.evaluate(() => {
        const btn = window.chartRoot.querySelector('.apexcharts-ink-btn--bold')
        return {
          open: !!window.chartRoot.querySelector('.apexcharts-ink-card'),
          bold: !!btn && btn.classList.contains('apexcharts-ink-btn--active'),
        }
      })
      expect(state).toEqual({ open: true, bold: true })
    })

    // C4: Measure binds keys and drag move/up on the document.
    test('C4a measure: hold M and drag pins a ruler', async ({ page, setup }) => {
      await setup(['measure'])
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        { mode, opts: lineOpts({ measure: { enabled: true } }) },
      )
      await page.keyboard.down('m')
      await settle(page, 100)
      const pane = await centreOf(page, '.apexcharts-measure-capture')
      expect(pane, 'M did not arm the capture pane').not.toBeNull()
      await page.mouse.move(pane.left + pane.w * 0.25, pane.y)
      await page.mouse.down()
      await page.mouse.move(pane.left + pane.w * 0.5, pane.y, { steps: 4 })
      await page.mouse.move(pane.left + pane.w * 0.75, pane.y, { steps: 4 })
      await page.mouse.up()
      await page.keyboard.up('m')
      await settle(page, 150)
      expect(
        await page.evaluate(
          () =>
            window.chartRoot.querySelectorAll('.apexcharts-measure-pins .apexcharts-measure-band')
              .length,
        ),
      ).toBe(1)
    })

    test('C4c measure: startMeasure then a drag pins a ruler', async ({ page, setup }) => {
      await setup(['measure'])
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        { mode, opts: lineOpts({ measure: { enabled: true } }) },
      )
      await page.evaluate(() => window.chart.startMeasure())
      const pane = await centreOf(page, '.apexcharts-measure-capture')
      await page.mouse.move(pane.left + pane.w * 0.25, pane.y)
      await page.mouse.down()
      await page.mouse.move(pane.left + pane.w * 0.5, pane.y, { steps: 4 })
      await page.mouse.move(pane.left + pane.w * 0.75, pane.y, { steps: 4 })
      await page.mouse.up()
      await settle(page, 150)
      expect(
        await page.evaluate(() => ({
          pins: window.chartRoot.querySelectorAll('.apexcharts-measure-pins .apexcharts-measure-band').length,
          live: !!window.chartRoot.querySelector('.apexcharts-measure-live'),
        })),
      ).toEqual({ pins: 1, live: false })
    })

    test('C4b measure: Escape mid-drag cancels the ruler', async ({ page, setup }) => {
      await setup(['measure'])
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        { mode, opts: lineOpts({ measure: { enabled: true } }) },
      )
      await page.evaluate(() => window.chart.startMeasure())
      const pane = await centreOf(page, '.apexcharts-measure-capture')
      await page.mouse.move(pane.left + pane.w * 0.25, pane.y)
      await page.mouse.down()
      await page.mouse.move(pane.left + pane.w * 0.6, pane.y, { steps: 4 })
      await page.keyboard.press('Escape')
      await page.mouse.up()
      await settle(page, 150)
      expect(
        await page.evaluate(() => ({
          pins: window.chartRoot.querySelectorAll('.apexcharts-measure-pins .apexcharts-measure-band').length,
          live: !!window.chartRoot.querySelector('.apexcharts-measure-live'),
        })),
      ).toEqual({ pins: 0, live: false })
    })

    // C5: after a keyboard zoom re-renders the SVG, focus moves to the new SVG
    // only when document.activeElement is body; in a shadow root it is the host.
    test('C5 keyboard zoom keeps focus, so a second + zooms again', async ({
      page,
      setup,
    }) => {
      await setup()
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        {
          mode,
          opts: lineOpts(
            { zoom: { enabled: true }, toolbar: { show: true } },
            { series: [{ name: 'S', data: Array.from({ length: 40 }, (_, i) => [i, (i * 7) % 23]) }] },
          ),
        },
      )
      const range = () =>
        page.evaluate(() => window.chart.w.globals.maxX - window.chart.w.globals.minX)
      const r0 = await range()
      await page.evaluate(() => window.chart.w.dom.Paper.node.focus())
      await page.keyboard.press('+')
      await settle(page, 400)
      const r1 = await range()
      expect(r1).toBeLessThan(r0)
      const focused = await page.evaluate(() => {
        const svg = window.chart.w.dom.Paper.node
        return svg.getRootNode().activeElement === svg
      })
      await page.keyboard.press('+')
      await settle(page, 400)
      const r2 = await range()
      expect({ focused, zoomedAgain: r2 < r1 }).toEqual({ focused: true, zoomedAgain: true })
    })

    // C6: Storyboard resolves selectors and auto-discovers beats on the document.
    test('C6a storyboard auto-discovers beats in the same root', async ({
      page,
      setup,
    }) => {
      await setup(['storyboard'])
      const n = await page.evaluate(async (mode) => {
        await window.__mount(mode, {
          chart: { type: 'line' },
          series: [{ name: 'S', data: [10, 40, 25, 50] }],
          xaxis: { categories: ['a', 'b', 'c', 'd'] },
        })
        for (let i = 0; i < 3; i++) {
          const d = document.createElement('div')
          d.id = 'beat' + i
          d.setAttribute('data-apex-beat', 'k' + i)
          d.style.height = '400px'
          d.textContent = 'beat ' + i
          window.chartRoot.appendChild(d)
        }
        return window.chart.storyboard.bind({})
      }, mode)
      expect(n).toBe(3)
    })

    test('C6b storyboard beat selectors resolve in the same root', async ({
      page,
      setup,
    }) => {
      await setup(['storyboard'])
      const n = await page.evaluate(async (mode) => {
        await window.__mount(mode, {
          chart: { type: 'line' },
          series: [{ name: 'S', data: [10, 40, 25, 50] }],
          xaxis: { categories: ['a', 'b', 'c', 'd'] },
        })
        for (let i = 0; i < 2; i++) {
          const d = document.createElement('div')
          d.id = 'sbeat' + i
          d.style.height = '400px'
          window.chartRoot.appendChild(d)
        }
        return window.chart.storyboard.bind({
          beats: [{ selector: '#sbeat0' }, { selector: '#sbeat1' }],
        })
      }, mode)
      expect(n).toBe(2)
    })

    // C7: the brush rect drags (SVGDraggable) and resizes (SVGSelectable) on
    // document-level move/up listeners.
    test('C7 selection rect drags and its handle resizes', async ({ page, setup }) => {
      await setup()
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        {
          mode,
          opts: lineOpts(
            {
              toolbar: { autoSelected: 'selection' },
              selection: { enabled: true, type: 'x', xaxis: { min: 3, max: 5 } },
            },
            { series: [{ name: 'S', data: Array.from({ length: 10 }, (_, i) => [i, (i * 7) % 11]) }] },
          ),
        },
      )
      const geo = () =>
        page.evaluate(() => {
          const r = window.chartRoot.querySelector('.apexcharts-selection-rect')
          return { x: parseFloat(r.getAttribute('x')), w: parseFloat(r.getAttribute('width')) }
        })
      const g0 = await geo()
      expect(g0.w).toBeGreaterThan(10)
      const body = await centreOf(page, '.apexcharts-selection-rect')
      await page.mouse.move(body.x, body.y)
      await page.mouse.down()
      await page.mouse.move(body.x + 30, body.y, { steps: 5 })
      await page.mouse.move(body.x + 60, body.y, { steps: 5 })
      await page.mouse.up()
      await settle(page, 300)
      const g1 = await geo()
      // Right resize handle (order: t, b, l, r, ...).
      const h = await page.evaluate(() => {
        const n = window.chartRoot.querySelectorAll('.svg_select_points > g')[3]
        if (!n) return null
        const b = n.getBoundingClientRect()
        return { x: b.x + b.width / 2, y: b.y + b.height / 2 }
      })
      expect(h, 'no resize handle').not.toBeNull()
      await page.mouse.move(h.x, h.y)
      await page.mouse.down()
      await page.mouse.move(h.x + 20, h.y, { steps: 5 })
      await page.mouse.move(h.x + 40, h.y, { steps: 5 })
      await page.mouse.up()
      await settle(page, 300)
      const g2 = await geo()
      expect({
        moved: Math.round(g1.x - g0.x) >= 40,
        resized: Math.round(g2.w - g1.w) >= 25,
      }).toEqual({ moved: true, resized: true })
      // A further move after release must not drag anything.
      await page.mouse.move(h.x + 120, h.y, { steps: 3 })
      const g3 = await geo()
      expect(g3).toEqual(g2)
    })

    // C8: font embedding walks document.styleSheets only.
    test('C8 export embeds an @font-face declared in the chart root', async ({
      page,
      setup,
    }) => {
      await page.route('https://assets.test/verify.woff2', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'font/woff2',
          headers: { 'access-control-allow-origin': '*' },
          body: Buffer.alloc(512, 7),
        }),
      )
      await setup()
      const svg = await page.evaluate(async (mode) => {
        const { root } = window.__makeRoot(mode)
        const st = document.createElement('style')
        st.textContent =
          "@font-face { font-family: 'VerifyFont'; src: url('https://assets.test/verify.woff2') format('woff2'); }"
        root.appendChild(st)
        const target = document.createElement('div')
        target.style.width = '600px'
        root.appendChild(target)
        window.chart = new ApexCharts(target, {
          chart: { type: 'line', height: 300, animations: { enabled: false }, fontFamily: 'VerifyFont, sans-serif' },
          series: [{ name: 'S', data: [10, 40, 25, 50] }],
          xaxis: { categories: ['a', 'b', 'c', 'd'] },
        })
        await window.chart.render()
        return window.chart.getSvgString()
      }, mode)
      const m = svg.match(/@font-face\s*\{[^}]*\}/i)
      expect(!!m && /url\(\s*['"]?data:/i.test(m[0]), 'font not embedded').toBe(true)
    })

    // C8b: the usual web-component setup declares @font-face in the document
    // (shadow-scoped @font-face is not honoured by browsers); that must embed.
    test('C8b export embeds a document-level @font-face', async ({ page, setup }) => {
      await page.route('https://assets.test/verify.woff2', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'font/woff2',
          headers: { 'access-control-allow-origin': '*' },
          body: Buffer.alloc(512, 7),
        }),
      )
      await setup()
      const svg = await page.evaluate(async (mode) => {
        const st = document.createElement('style')
        st.textContent =
          "@font-face { font-family: 'VerifyFont'; src: url('https://assets.test/verify.woff2') format('woff2'); }"
        document.head.appendChild(st)
        await window.__mount(mode, {
          chart: { type: 'line', fontFamily: 'VerifyFont, sans-serif' },
          series: [{ name: 'S', data: [10, 40, 25, 50] }],
          xaxis: { categories: ['a', 'b', 'c', 'd'] },
        })
        return window.chart.getSvgString()
      }, mode)
      const m = svg.match(/@font-face\s*\{[^}]*\}/i)
      expect(!!m && /url\(\s*['"]?data:/i.test(m[0]), 'font not embedded').toBe(true)
    })

    // C9: tooltip clamp against an overflow-clipping ancestor outside the root.
    test('C9 tooltip stays inside a clipping ancestor across the host', async ({
      page,
      setup,
    }) => {
      await setup()
      await page.evaluate(async (mode) => {
        const clip = document.createElement('div')
        clip.id = 'clip'
        clip.style.cssText = 'width:420px;overflow:auto;margin-left:40px'
        document.getElementById('mount').appendChild(clip)
        await window.__mount(
          mode,
          {
            chart: { type: 'line' },
            series: [
              { name: 'A long series name', data: [10, 40, 25, 50, 49, 60, 70, 91, 30, 20] },
              { name: 'Another long name', data: [20, 30, 45, 40, 59, 50, 60, 71, 50, 40] },
            ],
            xaxis: { categories: 'abcdefghij'.split('') },
          },
          { width: 700, into: clip },
        )
      }, mode)
      const clip = await page.evaluate(() => document.getElementById('clip').getBoundingClientRect().toJSON())
      const plot = await centreOf(page, '.apexcharts-grid')
      await page.mouse.move(clip.right - 40, plot.y - 10, { steps: 3 })
      await page.mouse.move(clip.right - 30, plot.y, { steps: 3 })
      await settle(page, 300)
      const tt = await page.evaluate(() => {
        const t = window.chartRoot.querySelector('.apexcharts-tooltip.apexcharts-active')
        return t ? t.getBoundingClientRect().toJSON() : null
      })
      expect(tt, 'tooltip not shown').not.toBeNull()
      expect(tt.right).toBeLessThanOrEqual(clip.right + 1)
    })

    // C10: the premium watermark must be present and visibly styled.
    test('C10 trial watermark is painted and visible', async ({ page, setup }) => {
      await setup(['ink'])
      await page.evaluate(
        (a) => window.__mount(a.mode, a.opts),
        { mode, opts: lineOpts({ ink: { enabled: true } }) },
      )
      await settle(page, 200)
      const wm = await page.evaluate(() => {
        const n = window.chartRoot.querySelector('[data-apexcharts-watermark]')
        if (!n) return null
        const cs = getComputedStyle(n)
        const b = n.getBoundingClientRect()
        const c = window.chart.el.getBoundingClientRect()
        return {
          visible:
            cs.display !== 'none' &&
            cs.visibility !== 'hidden' &&
            parseFloat(cs.opacity) > 0 &&
            b.width > 0 &&
            b.height > 0 &&
            cs.backgroundImage.startsWith('url('),
          inside: b.left >= c.left - 1 && b.right <= c.right + 1 && b.top >= c.top - 1 && b.bottom <= c.bottom + 1,
          position: cs.position,
        }
      })
      expect(wm, 'no watermark node').not.toBeNull()
      expect(wm).toMatchObject({ visible: true, inside: true })
    })
  })
}
