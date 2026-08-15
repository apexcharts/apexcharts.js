/**
 * A chart type installs a `tooltip.custom` for itself, and that formatter reads
 * globals only that type fills. Type defaults are applied once, by Config.init
 * on the initial render, so `updateOptions({ chart: { type } })` used to leave
 * the OUTGOING type's formatter behind.
 *
 * Loudly, one way round: a box plot that became a violin kept asking for the
 * five-number summary nobody computes for a violin, and threw on every hover.
 * The throw aborted the tooltip pipeline, so there was no caption at all and
 * the crosshair stayed on whichever category it had last drawn, which reads as
 * "hovering the third violin highlights the first". Quietly the other way: a
 * box plot captioned with the violin's density range, no error anywhere.
 *
 * So this asserts what a reader is actually told, and that the crosshair moves
 * with the mark. Counting tooltip elements would have called both green.
 */

import { test as base, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')
const distPath = resolve(rootDir, 'dist', 'apexcharts.js')

const TIERS = [
  { x: 'Express', points: [1.2, 1.4, 1.5, 1.6, 1.8, 1.3, 1.7, 1.5, 1.4, 1.6] },
  { x: 'Standard', points: [2.4, 2.6, 2.8, 4.2, 4.4, 4.6, 2.5, 4.3, 2.7, 4.5] },
  { x: 'Economy', points: [4.2, 4.6, 5.0, 5.4, 6.0, 7.2, 9.0, 4.8, 5.2, 4.4] },
]
const SUMMARY = [{ name: 'Days', data: TIERS }]

const test = base.extend({
  consoleErrors: async ({ page: _page }, use) => {
    await use([])
  },
  boot: async ({ page, consoleErrors }, use) => {
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    /**
     * Render `from`, then change the type to `to`. Both sides get the same raw
     * observations, so the library derives each summary itself.
     *
     * @param {string} from initial chart.type
     * @param {string} to the type it becomes
     */
    const boot = async (from, to) => {
      await page.goto('about:blank')
      await page.setContent(
        '<div id="chart" style="width:820px;height:400px"></div>',
      )
      await page.addScriptTag({ path: distPath })
      await page.evaluate(
        async ([type, series]) => {
          window.chart = new ApexCharts(document.querySelector('#chart'), {
            chart: { type, height: 400, animations: { enabled: false } },
            series,
            legend: { show: false },
          })
          await window.chart.render()
        },
        [from, SUMMARY],
      )
      await page.waitForTimeout(250)
      await page.evaluate(
        async ([type, series]) => {
          await window.chart.updateOptions({ chart: { type }, series })
        },
        [to, SUMMARY],
      )
      await page.waitForTimeout(600)
    }

    await use(boot)

    expect(
      consoleErrors,
      `Unexpected JS errors on page:\n${consoleErrors.join('\n')}`,
    ).toHaveLength(0)
  },
})

/**
 * Hover a point on the mark itself, pulled slightly toward the chart centre so
 * a curved body is hit rather than the gap beside it. Two moves: the first
 * enters the element, the second is the mousemove the tooltip listens for.
 */
async function hoverMark(page, selector, i) {
  const marks = await page.$$(selector)
  const pt = await marks[i].evaluate((p) => {
    const at = p.getPointAtLength(p.getTotalLength() * 0.15)
    const m = p.getScreenCTM()
    const box = p.ownerSVGElement.getBoundingClientRect()
    const x = m.a * at.x + m.c * at.y + m.e
    const y = m.b * at.x + m.d * at.y + m.f
    return {
      x: x + (box.left + box.width / 2 - x) * 0.12,
      y: y + (box.top + box.height / 2 - y) * 0.12,
    }
  })
  await page.mouse.move(pt.x - 3, pt.y - 3)
  await page.waitForTimeout(100)
  await page.mouse.move(pt.x, pt.y)
  await page.waitForTimeout(250)
}

/** What the tooltip says, and where the crosshair is while it says it. */
async function readTooltip(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.apexcharts-tooltip')
    const crosshair = document.querySelector('.apexcharts-xcrosshairs')
    return {
      active: el.classList.contains('apexcharts-active'),
      text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      crosshairX: crosshair ? crosshair.getAttribute('x') : null,
    }
  })
}

test.describe('a summary that changes type is captioned by its new type', () => {
  test('box plot -> violin captions each violin, and the crosshair follows', async ({
    page,
    boot,
  }) => {
    await boot('boxPlot', 'violin')

    const seen = []
    for (let i = 0; i < 3; i++) {
      await hoverMark(page, '.apexcharts-violin-area', i)
      const tip = await readTooltip(page)
      expect(tip.active, `violin ${i} showed no tooltip`).toBe(true)
      // The violin's own caption. The box formatter it used to keep threw
      // instead, and threw before the crosshair had moved.
      expect(tip.text).toContain('Observations')
      expect(tip.text).not.toContain('Median')
      seen.push({ text: tip.text, crosshairX: tip.crosshairX })
    }

    // Each tier is captioned as itself, not all three as the first one.
    expect(new Set(seen.map((s) => s.text)).size).toBe(3)
    expect(new Set(seen.map((s) => s.crosshairX)).size).toBe(3)
  })

  test('violin -> box plot captions the five numbers, not the density', async ({
    page,
    boot,
  }) => {
    await boot('violin', 'boxPlot')

    await hoverMark(page, '.apexcharts-boxPlot-area', 0)
    const tip = await readTooltip(page)
    expect(tip.active).toBe(true)
    expect(tip.text).toContain('Median')
    expect(tip.text).not.toContain('Observations')
  })
})
