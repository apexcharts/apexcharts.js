/**
 * Trellis sizing, in a real browser (jsdom has no layout, so these cannot
 * live in the unit suite).
 *
 * Three field reports, one chain:
 *   - `chart.height: '100%'` was parsed as 100 PIXELS, so a full-height grid
 *     laid itself out for a 100px box and every panel hit the height floor;
 *   - the resize observer returned early whenever the WIDTH was unchanged, so
 *     a height-only container resize never refitted the panels;
 *   - the layout ignored the shared chrome (title, toolbar band, legend), so
 *     the grid came out taller than the host by exactly that much.
 *
 * The overflow that the minimum-panel-height floor still forces is deliberate
 * — a panel below the floor is unreadable — but it now says so, and
 * `trellis.minPanelHeight` is the way out.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const umdPath = resolve(rootDir, 'dist', 'apexcharts.js')
const trellisAddonPath = resolve(rootDir, 'dist', 'features', 'trellis.js')

/**
 * Mount a trellis into a host that fills a fixed-size outer box, so a
 * percentage height has a real container to resolve against.
 */
async function mountSized(page, { facets = 2, trellis = {}, chart = {}, outer }) {
  const warnings = []
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'warning') warnings.push(m.text())
  })

  await page.setContent(
    `<div id="outer" style="width:${outer.width}px;height:${outer.height}px">
       <div id="trellis" style="height:100%"></div>
     </div>`,
  )
  await page.addScriptTag({ path: umdPath })
  await page.addScriptTag({ path: trellisAddonPath })

  await page.evaluate(
    ([facets, trellisSrc, chartSrc]) => {
      const keys = 'ABCDEFGH'.slice(0, facets).split('')
      window.chart = new window.ApexCharts(document.querySelector('#trellis'), {
        chart: {
          type: 'bar',
          animations: { enabled: false },
          ...JSON.parse(chartSrc),
        },
        trellis: { by: 'facet', virtualize: false, ...JSON.parse(trellisSrc) },
        series: keys.map((k) => ({
          name: 'S',
          facet: k,
          data: [
            { x: 'a', y: 1 },
            { x: 'b', y: 2 },
          ],
        })),
      })
      return window.chart.render()
    },
    [facets, JSON.stringify(trellis), JSON.stringify(chart)],
  )
  await page.waitForFunction(
    () => window.chart && window.chart.getPanels().length > 0,
    { timeout: 10_000 },
  )
  await page.waitForTimeout(200)
  return { warnings, errors }
}

/** Measured boxes and the layout the trellis resolved. */
function readSizing(page) {
  return page.evaluate(() => {
    const t = window.chart.trellis
    const wrap = document.querySelector('.apexcharts-trellis')
    const outer = document.querySelector('#outer')
    const px = (el) => +el.getBoundingClientRect().height.toFixed(1)
    return {
      hostHeight: t._hostHeight(),
      chromeH: t._chromeH,
      panelH: t.layout.panelH,
      rows: t.layout.rows,
      gridH: t.layout.gridH,
      overflowH: t.layout.overflowH,
      wrapH: px(wrap),
      outerH: px(outer),
      panelSvgH: window.chart
        .getPanels()
        .map((p) => +p.el.querySelector('.apexcharts-svg').getBoundingClientRect().height.toFixed(1)),
    }
  })
}

test.describe('trellis sizing', () => {
  test("chart.height '100%' fills the container instead of laying out for 100px", async ({
    page,
  }) => {
    const { errors } = await mountSized(page, {
      outer: { width: 900, height: 500 },
      chart: { height: '100%' },
    })
    const s = await readSizing(page)

    expect(errors).toEqual([])
    expect(s.hostHeight).toBe(500)
    // The floor is 80; the bug pinned every panel to it.
    expect(s.panelH).toBeGreaterThan(300)
    expect(s.wrapH).toBeLessThanOrEqual(500.5)
    expect(s.overflowH).toBe(0)
  })

  test('a height-only container resize refits the panels', async ({ page }) => {
    await mountSized(page, {
      outer: { width: 900, height: 600 },
      chart: { height: '100%' },
    })
    const before = await readSizing(page)

    await page.evaluate(() => {
      document.querySelector('#outer').style.height = '300px'
    })
    await page.waitForTimeout(500)
    const after = await readSizing(page)

    expect(before.panelH).toBeGreaterThan(after.panelH)
    expect(after.hostHeight).toBe(300)
    expect(after.wrapH).toBeLessThanOrEqual(300.5)
    // The panels themselves moved, not just the record of them.
    expect(after.panelSvgH[0]).toBeLessThan(before.panelSvgH[0])

    // And back up again.
    await page.evaluate(() => {
      document.querySelector('#outer').style.height = '600px'
    })
    await page.waitForTimeout(500)
    const restored = await readSizing(page)
    expect(restored.panelH).toBe(before.panelH)
  })

  test('the grid fits inside its declared height, chrome included', async ({
    page,
  }) => {
    // 4 facets with a shared legend and the toolbar band: the chrome is the
    // part the layout used to hand to the panels and then overflow by.
    await mountSized(page, {
      facets: 4,
      outer: { width: 900, height: 520 },
      chart: { height: 520 },
    })
    const s = await readSizing(page)

    expect(s.chromeH).toBeGreaterThan(0)
    expect(s.gridH + s.chromeH).toBeLessThanOrEqual(520)
    expect(s.wrapH).toBeLessThanOrEqual(520.5)
    expect(s.overflowH).toBe(0)
  })

  test('a host too short for the panel floor says so, and minPanelHeight is the way out', async ({
    page,
  }) => {
    const { warnings } = await mountSized(page, {
      facets: 6,
      trellis: { columns: 2 },
      outer: { width: 800, height: 300 },
      chart: { height: '100%' },
    })
    const floored = await readSizing(page)

    expect(floored.panelH).toBe(80)
    expect(floored.overflowH).toBeGreaterThan(0)
    expect(warnings.some((w) => /trellis needs \d+px/.test(w))).toBe(true)
    expect(warnings.some((w) => /minPanelHeight/.test(w))).toBe(true)

    // Lowering the floor makes it fit.
    await mountSized(page, {
      facets: 6,
      trellis: { columns: 2, minPanelHeight: 40 },
      outer: { width: 800, height: 300 },
      chart: { height: '100%' },
    })
    const fitted = await readSizing(page)
    expect(fitted.panelH).toBeLessThan(80)
    expect(fitted.overflowH).toBe(0)
    expect(fitted.wrapH).toBeLessThanOrEqual(300.5)
  })
})
