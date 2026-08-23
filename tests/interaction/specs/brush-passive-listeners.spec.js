/**
 * #3533: "Unable to preventDefault inside passive event listener invocation."
 * on the brush demo, on clicking the selection.
 *
 * Already fixed, in v3.47.0 (`6a300a50e`), and incidentally: that commit was
 * about `autoScaleYaxis`, and its message notes in passing that the work
 * "exposed the disableDefault in passive event listener common issue, which was
 * resolved by setting passive: false in svg.js". The vendored svg.js `on()`
 * helper had defaulted every listener it attached to `passive: true`, so the
 * draggable plugin's own `preventDefault` tripped Chrome's intervention. Bisected
 * against the published builds: 3.36.3, 3.40.0, 3.44.0 and 3.46.0 all fire it,
 * 3.47.0 onwards do not.
 *
 * This spec exists because the issue collected 13 participants over 3.7 years on
 * a page linked from our own documentation, and nothing guarded it. svg.js is
 * gone now (src/svg/ is ours), and today the fix is structural rather than a
 * flag: SVGDraggable's document-level touchmove handler does not call
 * preventDefault at all, and ZoomPanSelection.selectionDragging calls it on a
 * non-cancelable CustomEvent, where it is a silent no-op. A future change that
 * makes that CustomEvent cancelable, or that adds a preventDefault to the drag
 * handler, would bring the warning straight back.
 *
 * The last test is a deliberate positive control. Without it, a change that
 * broke console capture would turn this whole file green while the warning
 * flowed freely.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

/** Chrome's wording, which is what users paste into the issue tracker. */
const INTERVENTION = /Unable to preventDefault inside passive event listener/i

const test = base.extend({
  /** Every console message, any type: the intervention arrives as an error. */
  messages: async ({ page }, use) => {
    /** @type {string[]} */
    const messages = []
    page.on('console', (m) => messages.push(`${m.type()}: ${m.text()}`))
    page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`))
    await use(messages)
  },

  /**
   * A brush pair on a deliberately tall page, so a vertical touch drag competes
   * with page scrolling. That competition is what makes the passive-by-default
   * touchmove path live; on a short page the browser has no scroll to protect.
   * @returns {Promise<{x: number, y: number, w: number, h: number}>}
   */
  brush: async ({ page }, use) => {
    const boot = async () => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart2" style="width:650px"></div>' +
          '<div id="chart1" style="width:650px"></div>' +
          '<div style="height:2500px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      const rect = await page.evaluate(async () => {
        const t0 = Date.UTC(2025, 0, 1)
        const data = Array.from({ length: 180 }, (_, i) => [
          t0 + i * 86400000,
          Math.round(40 + 30 * Math.sin(i / 11)),
        ])
        window.main = new ApexCharts(document.querySelector('#chart2'), {
          chart: { id: 'chart2', type: 'line', height: 230 },
          series: [{ name: 'v', data }],
          xaxis: { type: 'datetime' },
          dataLabels: { enabled: false },
        })
        await window.main.render()
        window.chart = new ApexCharts(document.querySelector('#chart1'), {
          chart: {
            id: 'chart1',
            height: 130,
            type: 'area',
            brush: { target: 'chart2', enabled: true },
            selection: {
              enabled: true,
              xaxis: { min: t0 + 20 * 86400000, max: t0 + 70 * 86400000 },
            },
          },
          series: [{ name: 'v', data }],
          xaxis: { type: 'datetime' },
          dataLabels: { enabled: false },
        })
        await window.chart.render()

        // The MAIN chart also carries a selection rect, an empty 0x0 one. Taking
        // that by index makes every drag below a silent no-op, which reads as a
        // pass. Pick the one that actually has a width.
        const el = [
          ...document.querySelectorAll('.apexcharts-selection-rect'),
        ].filter((n) => parseFloat(n.getAttribute('width')) > 0)[0]
        if (!el) return null
        const b = el.getBoundingClientRect()
        return { x: b.x, y: b.y, w: b.width, h: b.height }
      })
      await page.waitForTimeout(150)
      return rect
    }
    await use(boot)
  },
})

/** Real touch: this goes through the browser's own passive machinery, which a
 *  hand-built `new TouchEvent(...)` dispatched at a node does not. */
async function touchDrag(page, from, dx, dy) {
  const cdp = await page.context().newCDPSession(page)
  const send = (type, x, y) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints:
        type === 'touchEnd'
          ? []
          : [{ x, y, radiusX: 8, radiusY: 8, force: 1, id: 1 }],
    })
  await send('touchStart', from.x, from.y)
  for (let i = 1; i <= 10; i++) {
    await send('touchMove', from.x + (dx * i) / 10, from.y + (dy * i) / 10)
    await page.waitForTimeout(16)
  }
  await send('touchEnd', 0, 0)
  await page.waitForTimeout(120)
  await cdp.detach()
}

const interventions = (messages) => messages.filter((m) => INTERVENTION.test(m))

test.describe('Brush selection fires no passive-listener intervention (#3533)', () => {
  test('a plain click on the selection, which is the reported action', async ({
    page,
    brush,
    messages,
  }) => {
    const r = await brush()
    expect(r, 'brush selection rect not found').not.toBeNull()

    await page.mouse.move(r.x + r.w / 2, r.y + r.h / 2)
    await page.mouse.down()
    await page.waitForTimeout(60)
    await page.mouse.up()
    await page.waitForTimeout(150)

    // pre-3.47 this alone produced two
    expect(interventions(messages)).toEqual([])
  })

  test('dragging the selection body and its right edge', async ({
    page,
    brush,
    messages,
  }) => {
    const r = await brush()

    for (const startX of [r.x + r.w / 2, r.x + r.w - 1]) {
      await page.mouse.move(startX, r.y + r.h / 2)
      await page.mouse.down()
      for (let i = 1; i <= 8; i++) {
        await page.mouse.move(startX + i * 7, r.y + r.h / 2, { steps: 2 })
        await page.waitForTimeout(16)
      }
      await page.mouse.up()
      await page.waitForTimeout(120)
    }

    expect(interventions(messages)).toEqual([])
    // and the drag did something, so the assertion above was not vacuous
    const moved = await page.evaluate(() =>
      parseFloat(
        [...document.querySelectorAll('.apexcharts-selection-rect')]
          .filter((n) => parseFloat(n.getAttribute('width')) > 0)[0]
          .getAttribute('x'),
      ),
    )
    expect(moved).not.toBeCloseTo(r.x, 0)
  })

  test('wheel over the brush chart and over its target', async ({
    page,
    brush,
    messages,
  }) => {
    await brush()

    for (const sel of ['#chart2', '#chart1']) {
      const b = await page.locator(sel).boundingBox()
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2)
      await page.mouse.wheel(0, -180)
      await page.waitForTimeout(180)
    }

    expect(interventions(messages)).toEqual([])
  })

  test('a real touch drag, sideways and against the page scroll', async ({
    page,
    brush,
    messages,
  }) => {
    const r = await brush()
    const centre = { x: r.x + r.w / 2, y: r.y + r.h / 2 }

    await touchDrag(page, centre, 60, 0)
    // vertical is the direction the browser wants for scrolling, so this is the
    // drag that a passive-default touchmove handler would complain about
    await touchDrag(page, centre, 0, 60)

    expect(interventions(messages)).toEqual([])
  })

  test('CONTROL: the detector above actually sees an intervention', async ({
    page,
    messages,
  }) => {
    // Every assertion in this file is "no message matched". That is only
    // meaningful if a real intervention would be caught, so provoke one.
    await page.goto('about:blank')
    await page.setContent('<div id="t" style="width:400px;height:300px"></div>')
    await page.evaluate(() => {
      document
        .getElementById('t')
        .addEventListener('wheel', (e) => e.preventDefault(), { passive: true })
    })
    await page.mouse.move(200, 150)
    await page.mouse.wheel(0, 120)
    await page.waitForTimeout(250)

    expect(interventions(messages).length).toBeGreaterThan(0)
  })
})
