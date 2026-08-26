/**
 * #3352: printing a full-width chart cuts it off at the edge of the paper.
 *
 * The sheet is a layout the page never sees. Measured inside a `beforeprint`
 * handler, `documentElement.clientWidth` is still the screen's, no resize of any
 * kind is reported for the paper box, and `matchMedia('print').matches` is still
 * false. So nothing in the library could ever learn the printable width, and a
 * chart sized from a 1600px screen printed at 1600px with its right-hand side
 * off the sheet. Verified by rendering real PDFs: of twelve months, only Jan to
 * Aug survived.
 *
 * The chart now lays itself out at `chart.print.width` while printing and puts
 * itself back afterwards. Laying out again rather than scaling is what keeps the
 * labels legible: scaling a 1568px chart onto A4 would shrink 12px text to about
 * 5px. Since the real printable width is unknowable, the print stylesheet caps
 * whatever is left over, and the identity viewBox added here is what turns that
 * cap into a scale rather than a crop.
 *
 * These tests drive the two print events directly and check the DOM, which is
 * the whole mechanism; the printed output itself was verified out of band by
 * rasterising PDFs, since page.pdf() only works in headless Chromium.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')
const trellisPath = resolve(rootDir, 'dist', 'features', 'trellis.js')

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const wideChart = (chart = {}) => ({
  chart: { type: 'area', height: 300, width: '100%', animations: { enabled: false }, ...chart },
  series: [{ name: 'revenue', data: [31, 40, 28, 51, 42, 109, 100, 88, 120, 95, 140, 130] }],
  xaxis: { categories: MONTHS },
})

const test = base.extend({
  /**
   * Renders chart(s) in a wide page, then reports the state before, during and
   * after a print. The two print events are dispatched directly: what the
   * handlers do to the DOM is the entire fix.
   */
  printRun: async ({ page }, use) => {
    /**
     * @param {{
     *   opts?: any, opts2?: any, addons?: string[], html?: string,
     *   printMedia?: boolean, viewport?: {width: number, height: number},
     *   twice?: boolean, waitFor?: number,
     * }} spec
     */
    const printRun = async (spec) => {
      /** @type {string[]} */
      const thrown = []
      page.on('pageerror', (e) => thrown.push(e.message))
      if (spec.viewport) await page.setViewportSize(spec.viewport)
      await page.goto('about:blank')
      await page.setContent(
        spec.html ??
          '<div id="chart" style="width:100%"></div><div id="chart2" style="width:100%"></div>',
      )
      await page.addScriptTag({ path: distPath })
      for (const addon of spec.addons ?? []) {
        await page.addScriptTag({ path: addon })
      }
      await page.evaluate(
        ({ opts, opts2 }) => {
          window.updates = 0
          const proto = ApexCharts.prototype
          const update = proto.update
          proto.update = function (...args) {
            window.updates++
            return update.apply(this, args)
          }
          window.apexMain = new ApexCharts(document.querySelector('#chart'), opts)
          window.apexMain.render()
          if (opts2) {
            window.apexSibling = new ApexCharts(
              document.querySelector('#chart2'),
              opts2,
            )
            window.apexSibling.render()
          }
          window.state = () => {
            const host = document.querySelector('#chart')
            const svg = host.querySelector('svg')
            if (!svg) return { missing: true, updates: window.updates }
            const canvas = host.querySelector('.apexcharts-canvas')
            const w = window.apexMain.w
            return {
              // what the chart was laid out at, and what it is showing
              laidOutAt: w.globals.svgWidth,
              attrWidth: svg && svg.getAttribute('width'),
              rendered: svg ? Math.round(svg.getBoundingClientRect().width) : null,
              hostWidth: Math.round(host.getBoundingClientRect().width),
              viewBox: svg && svg.getAttribute('viewBox'),
              printing: !!canvas &&
                canvas.classList.contains('apexcharts-printing'),
              configWidth: w.config.chart.width,
              initialConfigWidth: w.globals.initialConfig?.chart?.width,
              toolbarDisplay: (() => {
                const bar = canvas && canvas.querySelector('.apexcharts-toolbar')
                return bar ? getComputedStyle(bar).display : null
              })(),
              updates: window.updates,
              sibling: window.apexSibling
                ? window.apexSibling.w.globals.svgWidth
                : null,
            }
          }
        },
        { opts: spec.opts ?? wideChart(), opts2: spec.opts2 },
      )
      await page.waitForFunction('document.querySelector("#chart svg")')
      await page.waitForTimeout(spec.waitFor ?? 400)
      if (spec.printMedia) await page.emulateMedia({ media: 'print' })

      const before = await page.evaluate('window.state()')
      await page.evaluate(() => {
        window.updates = 0
        window.dispatchEvent(new Event('beforeprint'))
      })
      const during = await page.evaluate('window.state()')
      await page.evaluate(() =>
        window.dispatchEvent(new Event('afterprint')),
      )
      await page.waitForTimeout(200)
      const after = await page.evaluate('window.state()')

      let second = null
      if (spec.twice) {
        await page.evaluate(() =>
          window.dispatchEvent(new Event('beforeprint')),
        )
        second = await page.evaluate('window.state()')
        await page.evaluate(() =>
          window.dispatchEvent(new Event('afterprint')),
        )
        await page.waitForTimeout(200)
        second = { during: second, after: await page.evaluate('window.state()') }
      }
      if (spec.printMedia) await page.emulateMedia({ media: null })
      return { before, during, after, second, thrown }
    }
    await use(printRun)
  },
})

test.describe('printing (#3352)', () => {
  test('a chart wider than the page is laid out at the print width', async ({
    printRun,
  }) => {
    const r = await printRun({ viewport: { width: 1400, height: 900 } })

    expect(r.before.laidOutAt).toBeGreaterThan(1000)
    // 700 is the default: A4/Letter portrait with the usual margins.
    expect(r.during.laidOutAt).toBe(700)
    expect(r.during.attrWidth).toBe('700')
    // and it is the same chart afterwards, not a 700px one
    expect(r.after.laidOutAt).toBe(r.before.laidOutAt)
    expect(r.after.configWidth).toBe('100%')
    expect(r.thrown).toEqual([])
  })

  test('the viewBox and the printing class come and go with the print', async ({
    printRun,
  }) => {
    const r = await printRun({ viewport: { width: 1400, height: 900 } })

    expect(r.before.viewBox).toBe(null)
    expect(r.before.printing).toBe(false)
    // identity viewBox over the printed layout: the stylesheet scales by it
    expect(r.during.viewBox).toBe('0 0 700 300')
    expect(r.during.printing).toBe(true)
    expect(r.after.viewBox).toBe(null)
    expect(r.after.printing).toBe(false)
  })

  test('printing does not rewrite the initial config', async ({ printRun }) => {
    // A print width leaking into initialConfig would outlive the print: a later
    // reset, or any responsive recalculation, would restore a 700px chart.
    const r = await printRun({ viewport: { width: 1400, height: 900 } })

    expect(r.before.initialConfigWidth).toBe('100%')
    expect(r.during.initialConfigWidth).toBe('100%')
    expect(r.after.initialConfigWidth).toBe('100%')
  })

  test('a chart already narrower than the page is left alone', async ({
    printRun,
  }) => {
    const r = await printRun({
      opts: wideChart({ width: 420 }),
      viewport: { width: 1400, height: 900 },
    })

    expect(r.during.laidOutAt).toBe(420)
    expect(r.during.updates).toBe(0)
    // no re-layout means nothing to restore, but the shrink net still applies
    expect(r.during.viewBox).toBe('0 0 420 300')
  })

  test('chart.print.width sets the layout width', async ({ printRun }) => {
    const r = await printRun({
      opts: wideChart({ print: { enabled: true, width: 480 } }),
      viewport: { width: 1400, height: 900 },
    })

    expect(r.during.laidOutAt).toBe(480)
    expect(r.after.laidOutAt).toBeGreaterThan(1000)
  })

  test('chart.print.enabled:false opts out completely', async ({ printRun }) => {
    const r = await printRun({
      opts: wideChart({ print: { enabled: false } }),
      viewport: { width: 1400, height: 900 },
    })

    expect(r.during.laidOutAt).toBe(r.before.laidOutAt)
    expect(r.during.viewBox).toBe(null)
    expect(r.during.printing).toBe(false)
    expect(r.during.updates).toBe(0)
  })

  test('under print media the chart shrinks to fit rather than being cut', async ({
    printRun,
  }) => {
    // The paper turns out narrower than the layout width, which is the case the
    // net exists for: the printable width is unknowable, so 700 is only ever a
    // good guess. Stood up here as a 500px box holding a chart laid out at 700,
    // since an emulated print page is still the size of the viewport.
    const r = await printRun({
      printMedia: true,
      viewport: { width: 1200, height: 900 },
      html: '<div id="chart" style="width:500px"></div>',
      opts: wideChart({ width: 900, print: { enabled: true, width: 700 } }),
    })

    expect(r.during.laidOutAt).toBe(700)
    expect(r.during.viewBox).toBe('0 0 700 300')
    // drawn no wider than the box that holds it...
    expect(r.during.rendered).toBeLessThanOrEqual(r.during.hostWidth + 2)
    // ...and it is the whole 700px drawing scaled down, not 500px of it cropped
    expect(r.during.rendered).toBeGreaterThan(400)
  })

  test('the print stylesheet leaves an opted-out chart uncapped', async ({
    printRun,
  }) => {
    // The rules must never reach an SVG with no viewBox: capping the width of
    // one crops the drawing, which would make opting out worse than the bug.
    const r = await printRun({
      printMedia: true,
      viewport: { width: 1200, height: 900 },
      html: '<div id="chart" style="width:500px"></div>',
      opts: wideChart({ width: 900, print: { enabled: false } }),
    })

    expect(r.during.viewBox).toBe(null)
    expect(r.during.rendered).toBe(900)
  })

  test('the toolbar is not printed', async ({ printRun }) => {
    const r = await printRun({
      printMedia: true,
      opts: wideChart({ toolbar: { show: true } }),
      viewport: { width: 1400, height: 900 },
    })

    expect(r.during.toolbarDisplay).toBe('none')
  })

  test('each chart in a synced group prints itself once', async ({
    printRun,
  }) => {
    // Sizing is per chart, so the print re-layout must not fan out across the
    // group: that would be one update per chart per sibling.
    const r = await printRun({
      opts: wideChart({ group: 'g', id: 'a' }),
      opts2: wideChart({ group: 'g', id: 'b' }),
      viewport: { width: 1400, height: 900 },
    })

    expect(r.during.updates).toBe(2) // one each
    expect(r.during.laidOutAt).toBe(700)
    expect(r.during.sibling).toBe(700)
    expect(r.after.sibling).toBeGreaterThan(1000)
  })

  test('printing twice in a row restores both times', async ({ printRun }) => {
    const r = await printRun({ twice: true, viewport: { width: 1400, height: 900 } })

    expect(r.during.laidOutAt).toBe(700)
    expect(r.after.laidOutAt).toBeGreaterThan(1000)
    expect(r.second.during.laidOutAt).toBe(700)
    expect(r.second.after.laidOutAt).toBeGreaterThan(1000)
    expect(r.second.after.viewBox).toBe(null)
  })

  test('printing part-way through an animation still restores', async ({
    printRun,
  }) => {
    const r = await printRun({
      opts: wideChart({ animations: { enabled: true, speed: 1200 } }),
      waitFor: 150,
      viewport: { width: 1400, height: 900 },
    })

    expect(r.during.laidOutAt).toBe(700)
    expect(r.after.laidOutAt).toBeGreaterThan(1000)
    expect(r.after.viewBox).toBe(null)
    expect(r.thrown).toEqual([])
  })

  test('a trellis grid is left to its orchestrator', async ({ printRun }) => {
    // Panel size and position belong to the grid. A panel re-laying itself out
    // at a printable width would tear the grid apart, so panels opt out.
    const r = await printRun({
      addons: [trellisPath],
      html: '<div id="chart" style="width:100%"></div>',
      opts: {
        chart: { type: 'line', height: 420, width: '100%', animations: { enabled: false } },
        trellis: { by: 'region', columns: 3 },
        series: [
          { name: 'Units', region: 'North', data: [10, 14, 9, 12, 15, 11, 13] },
          { name: 'Units', region: 'South', data: [6, 11, 15, 9, 7, 12, 10] },
          { name: 'Units', region: 'East', data: [8, 5, 12, 14, 9, 11, 7] },
        ],
      },
      waitFor: 900,
      viewport: { width: 1400, height: 900 },
    })

    expect(r.during.updates).toBe(0)
    expect(r.during.printing).toBe(false)
    expect(r.thrown).toEqual([])
  })
})
