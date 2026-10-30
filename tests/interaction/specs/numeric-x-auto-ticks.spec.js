/**
 * Numeric x values with no xaxis.type and no tickAmount.
 *
 * The chart converts such an axis to numeric and writes tickAmount
 * 'dataPoints' as its default. From 8.3 'dataPoints' meant one tick per point
 * on a single series, so a 400-point line drew 400 rotated labels on top of
 * each other. The automatic value is back to the count it had in 6.5.0 (ten
 * steps, eleven labels, laid out flat); a 'dataPoints' the user asks for still
 * gives one tick per point. Checked in a real browser because overlap and
 * rotation depend on measured text.
 */

import { test, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const BUNDLE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../dist/apexcharts.js',
)

async function render(page, xaxis) {
  await page.setContent('<div id="chart" style="width:800px"></div>')
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate((xaxis) => {
    const data = Array.from({ length: 400 }, (_, i) => ({
      x: i + 1,
      y: (i * 7) % 11,
    }))
    window.chart = new window.ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'line', height: 320, animations: { enabled: false } },
      series: [{ name: 's', data }],
      ...(xaxis ? { xaxis } : {}),
    })
    return window.chart.render()
  }, xaxis)
  await page.waitForSelector('.apexcharts-xaxis-label')
}

/** Every x label's text, box and whether it was drawn rotated. */
function readLabels(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.apexcharts-xaxis-label')].map((t) => {
      const b = t.getBoundingClientRect()
      return {
        text: t.textContent,
        left: b.left,
        right: b.right,
        rotated: /rotate\((?!0[ ,)])/.test(t.getAttribute('transform') || ''),
      }
    }),
  )
}

test.describe('Numeric x axis with no xaxis.type', () => {
  test('400 points draw eleven flat labels that do not overlap', async ({
    page,
  }) => {
    await render(page)
    const labels = await readLabels(page)
    expect(labels.map((l) => l.text)).toHaveLength(11)
    expect(labels.some((l) => l.rotated)).toBe(false)
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i].left).toBeGreaterThan(labels[i - 1].right)
    }
    // the first and last labels name the ends of the data
    expect(labels[0].text).toBe('1')
    expect(labels[labels.length - 1].text).toBe('400')
  })

  test("an explicit tickAmount: 'dataPoints' still ticks every point", async ({
    page,
  }) => {
    await render(page, { tickAmount: 'dataPoints' })
    expect(await page.evaluate(() => window.chart.w.globals.xTickAmount)).toBe(
      399,
    )
    expect(await page.locator('.apexcharts-xaxis-label').count()).toBe(400)
  })
})
