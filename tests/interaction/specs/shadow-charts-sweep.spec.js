/**
 * Shadow DOM audit, Wave 1 sweep: interactive surfaces with no suspect row in
 * plans/34-shadow-dom-audit.md, one check each, mounted light / shadow /
 * nested. A failure here that passes in light is filed as X1, X2... in
 * plans/34-findings-charts-dom.md.
 */

import { test, expect, MODES, centreOf } from '../fixtures/shadow-mount.js'

const CATS = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const BAR = {
  chart: { type: 'bar' },
  series: [
    { name: 'a', data: [30, 40, 35, 50, 49, 60, 70] },
    { name: 'b', data: [23, 12, 54, 61, 32, 56, 20] },
  ],
  xaxis: { categories: CATS },
  dataLabels: { enabled: false },
}
const NUMERIC = (chart = {}) => ({
  chart: { type: 'line', zoom: { enabled: true }, ...chart },
  series: [{ name: 'S', data: Array.from({ length: 40 }, (_, i) => [i, (i * 7) % 23]) }],
  xaxis: { type: 'numeric' },
})
const range = (page) =>
  page.evaluate(() => window.chart.w.globals.maxX - window.chart.w.globals.minX)
const wait = (page, ms = 350) => page.waitForTimeout(ms)

for (const mode of MODES) {
  test.describe(`[${mode}] sweep`, () => {
    test('hover shows the tooltip for the hovered bar', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: BAR })
      const bar = await centreOf(page, '.apexcharts-bar-area')
      await page.mouse.move(5, 5)
      await page.mouse.move(bar.x, bar.y, { steps: 3 })
      await wait(page, 250)
      const tt = await page.evaluate(() => {
        const t = window.chartRoot.querySelector('.apexcharts-tooltip.apexcharts-active')
        return t ? t.textContent : null
      })
      expect(tt).toContain('A')
    })

    test('legend click hides the series', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: BAR })
      const item = await centreOf(page, '.apexcharts-legend-series')
      await page.mouse.click(item.x, item.y)
      await wait(page)
      expect(
        await page.evaluate(() => window.chart.w.globals.collapsedSeriesIndices.length),
      ).toBe(1)
    })

    test('toolbar zoom in then reset', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: NUMERIC() })
      const r0 = await range(page)
      const zin = await centreOf(page, '.apexcharts-zoomin-icon')
      await page.mouse.click(zin.x, zin.y)
      await wait(page)
      const r1 = await range(page)
      const reset = await centreOf(page, '.apexcharts-reset-icon')
      await page.mouse.click(reset.x, reset.y)
      await wait(page)
      expect({ zoomed: r1 < r0, reset: (await range(page)) === r0 }).toEqual({
        zoomed: true,
        reset: true,
      })
    })

    test('toolbar pan drag moves the window', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), {
        mode,
        o: NUMERIC({ toolbar: { autoSelected: 'pan' } }),
      })
      await page.evaluate(() => window.chart.zoomX(10, 20))
      await wait(page)
      const minX0 = await page.evaluate(() => window.chart.w.globals.minX)
      const g = await centreOf(page, '.apexcharts-grid')
      await page.mouse.move(g.x, g.y)
      await page.mouse.down()
      await page.mouse.move(g.x - 60, g.y, { steps: 6 })
      await page.mouse.move(g.x - 120, g.y, { steps: 6 })
      await page.mouse.up()
      await wait(page, 500)
      expect(await page.evaluate(() => window.chart.w.globals.minX)).toBeGreaterThan(minX0)
    })

    test('export menu: SVG download runs, outside click closes', async ({
      page,
      setup,
    }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: BAR })
      const isOpen = () =>
        page.evaluate(() =>
          window.chartRoot.querySelector('.apexcharts-menu').classList.contains('apexcharts-menu-open'),
        )
      // Open the menu and wait for it, so the item is measured where it is
      // shown (measuring right after the click raced the open and missed it).
      const openMenu = async () => {
        if (await isOpen()) return
        await page.mouse.click(icon.x, icon.y)
        await page.waitForFunction(() =>
          window.chartRoot.querySelector('.apexcharts-menu').classList.contains('apexcharts-menu-open'),
        )
      }
      const icon = await centreOf(page, '.apexcharts-menu-icon')
      await openMenu()
      const svgItem = await centreOf(page, '.apexcharts-menu-item.exportSVG')
      const dl = page.waitForEvent('download', { timeout: 3000 }).then(
        () => true,
        () => false,
      )
      await page.mouse.click(svgItem.x, svgItem.y)
      const downloaded = await dl
      await openMenu()
      const openBefore = await isOpen()
      // The menu closes on a click elsewhere in the chart (its listener sits on
      // the chart, not the document), so click the plot.
      const plot = await centreOf(page, '.apexcharts-grid')
      await page.mouse.click(plot.x, plot.y)
      await wait(page, 100)
      const openAfter = await page.evaluate(() =>
        window.chartRoot.querySelector('.apexcharts-menu').classList.contains('apexcharts-menu-open'),
      )
      expect({ downloaded, openBefore, openAfter }).toEqual({
        downloaded: true,
        openBefore: true,
        openAfter: false,
      })

      // A press on the page outside the chart closes it too, not only one
      // inside the chart (the chart's own listener never hears those).
      await openMenu()
      const vp = page.viewportSize()
      await page.mouse.click(vp.width - 4, vp.height - 4)
      await wait(page, 100)
      expect(await isOpen()).toBe(false)
    })

    test('bare wheel shows the cooperative zoom hint', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: NUMERIC() })
      const g = await centreOf(page, '.apexcharts-grid')
      await page.mouse.move(g.x, g.y)
      await page.mouse.wheel(0, 120)
      await wait(page, 200)
      expect(
        await page.evaluate(
          () => !!window.chartRoot.querySelector('.apexcharts-wheel-hint-visible'),
        ),
      ).toBe(true)
    })

    test('ctrl+wheel zooms', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: NUMERIC() })
      const r0 = await range(page)
      const g = await centreOf(page, '.apexcharts-grid')
      await page.mouse.move(g.x, g.y)
      await page.keyboard.down('Control')
      await page.mouse.wheel(0, -240)
      await page.keyboard.up('Control')
      await wait(page, 500)
      expect(await range(page)).toBeLessThan(r0)
    })

    test('keyboard nav: ArrowRight opens the tooltip', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: BAR })
      await page.evaluate(() => window.chart.w.dom.Paper.node.focus())
      await page.keyboard.press('ArrowRight')
      await wait(page, 200)
      expect(
        await page.evaluate(
          () => !!window.chartRoot.querySelector('.apexcharts-tooltip.apexcharts-active'),
        ),
      ).toBe(true)
    })

    test('resizing the container re-lays out the chart', async ({ page, setup }) => {
      await setup()
      await page.evaluate((a) => window.__mount(a.mode, a.o), { mode, o: BAR })
      // Let the chart fill its container, then shrink the outermost host.
      await page.evaluate(async () => {
        window.chartHost.style.width = '600px'
        window.chart.el.style.width = ''
        await new Promise((r) => setTimeout(r, 400))
        window.chartHost.style.width = '400px'
      })
      await page.waitForFunction(
        () => Math.round(window.chart.w.dom.Paper.node.getBoundingClientRect().width) === 400,
        null,
        { timeout: 3000 },
      )
    })

    test('destroy keeps the injected style until the last chart in the root goes', async ({
      page,
      setup,
    }) => {
      await setup()
      const r = await page.evaluate(async (mode) => {
        const { root } = window.__makeRoot(mode)
        const mk = async () => {
          const t = document.createElement('div')
          t.style.width = '400px'
          root.appendChild(t)
          const c = new ApexCharts(t, {
            chart: { type: 'bar', height: 200, animations: { enabled: false } },
            series: [{ name: 'a', data: [1, 2, 3] }],
          })
          await c.render()
          return c
        }
        const scope = root.getRootNode ? root.getRootNode() : document
        const styled = () => !!scope.getElementById('apexcharts-css')
        const c1 = await mk()
        const c2 = await mk()
        const both = styled()
        c1.destroy()
        const one = styled()
        c2.destroy()
        return { both, one, none: styled() }
      }, mode)
      // The style must survive while one chart is left; after the last one it
      // should go.
      expect(r).toEqual({ both: true, one: true, none: false })
    })

    test('drilldown click drills in and the breadcrumb walks back', async ({
      page,
      setup,
    }) => {
      await setup(['drilldown'])
      await page.evaluate((mode) => window.__mount(mode, {
        chart: { type: 'bar' },
        series: [{ name: 'Sales', data: [
          { x: '2023', y: 100, drilldown: '2023-q' },
          { x: '2024', y: 150 },
        ] }],
        drilldown: { enabled: true, series: [{ id: '2023-q', name: 'Q', data: [
          { x: 'Q1', y: 20 }, { x: 'Q2', y: 30 },
        ] }] },
      }), mode)
      const bar = await centreOf(page, '.apexcharts-bar-area')
      await page.mouse.click(bar.x, bar.y)
      await page.waitForFunction(() => window.chart.drilldown.depth === 1, null, { timeout: 3000 })
      const crumb = await centreOf(page, 'button.apexcharts-breadcrumb-item')
      expect(crumb, 'no breadcrumb').not.toBeNull()
      await page.mouse.click(crumb.x, crumb.y)
      await page.waitForFunction(() => window.chart.drilldown.depth === 0, null, { timeout: 3000 })
    })

    test('treemap parent click zooms into the branch', async ({ page, setup }) => {
      await setup(['drilldown'])
      await page.evaluate((mode) => window.__mount(mode, {
        chart: { type: 'treemap' },
        plotOptions: { treemap: { zoom: { enabled: true } } },
        series: [{ data: [
          { x: 'A', children: [{ x: 'a1', y: 10 }, { x: 'a2', y: 20 }] },
          { x: 'B', children: [{ x: 'b1', y: 30 }, { x: 'b2', y: 15 }, { x: 'b3', y: 5 }] },
        ] }],
      }), mode)
      const count = () =>
        page.evaluate(() => window.chartRoot.querySelectorAll('.apexcharts-treemap-rect').length)
      const n0 = await count()
      const head = await centreOf(page, '.apexcharts-treemap-parent-header')
      expect(head, 'no parent header').not.toBeNull()
      await page.mouse.click(head.x, head.y)
      await wait(page, 800)
      const st = await page.evaluate(() => ({
        focus: window.chart.w.globals.treemapFocusKey,
        crumb: !!window.chartRoot.querySelector('.apexcharts-breadcrumb'),
      }))
      expect({ zoomed: st.focus != null, crumb: st.crumb, n0 }).toMatchObject({ zoomed: true })
    })

    test('chart.link highlight crosses two roots', async ({ page, setup }) => {
      await setup(['link'])
      const dimmed = await page.evaluate(async (mode) => {
        const mk = async (id, extra) => {
          const { root } = window.__makeRoot(mode)
          const t = document.createElement('div')
          t.style.width = '500px'
          root.appendChild(t)
          const c = new ApexCharts(t, {
            chart: {
              id, group: 'g1', type: 'bar', height: 260,
              animations: { enabled: false },
              link: { enabled: true },
              ...extra,
            },
            series: [{
              name: 's',
              data: [10, 20, 30, 40, 50, 60].map((v, i) => [Date.UTC(2024, 0, 1 + i), v]),
            }],
            xaxis: { type: 'datetime' },
            yaxis: { labels: { minWidth: 40 } },
          })
          await c.render()
          return { c, root }
        }
        const A = await mk('A', { selection: { enabled: true, type: 'x' }, toolbar: { autoSelected: 'selection' } })
        const B = await mk('B', {})
        window.chart = A.c
        window.chartRoot = A.root
        window.__B = B
        return null
      }, mode)
      expect(dimmed).toBeNull()
      const g = await centreOf(page, '.apexcharts-grid')
      await page.mouse.move(g.left + g.w * 0.05, g.y)
      await page.mouse.down()
      await page.mouse.move(g.left + g.w * 0.2, g.y, { steps: 4 })
      await page.mouse.move(g.left + g.w * 0.3, g.y, { steps: 6 })
      await page.mouse.up()
      await wait(page, 300)
      const n = await page.evaluate(
        () => window.__B.root.querySelectorAll('.apexcharts-crossfilter-dimmed').length,
      )
      expect(n).toBeGreaterThan(0)
    })
  })
}
