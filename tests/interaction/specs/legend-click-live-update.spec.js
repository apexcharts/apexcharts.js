/**
 * A legend click lands while the chart updates on a timer (#5345).
 *
 * A full render rebuilds the legend. When that happens between the press and
 * the release, the element under the pointer at pointerup is not the one that
 * got pointerdown, and the browser sends no click for the pair: the series
 * never toggled, however often the item was clicked on a live chart.
 */

import { test, expect } from '@playwright/test'
import { mountChart } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const series = (n) =>
  ['Alpha', 'Beta'].map((name, k) => ({
    name,
    data: Array.from({ length: n }, (_, i) => 10 + k * 8 + ((i * 5) % 7)),
  }))

const options = {
  chart: { type: 'line', height: 300, toolbar: { show: false } },
  legend: { show: true, position: 'bottom' },
  series: series(6),
}

const UPDATES = {
  // One more point each tick: the series lengths change, so the full render runs.
  updateSeries: () => window.chart.updateSeries(window.__next),
  updateOptions: () => window.chart.updateOptions({ title: { text: 'tick' } }),
}

const collapsed = (page) => page.evaluate(() => window.chart.w.globals.collapsedSeriesIndices.slice())

/** Press the item, re-render the chart, release on the rebuilt item. */
async function pressAcrossUpdate(page, name, update) {
  const box = await page.locator(`.apexcharts-legend-series[seriesName="${name}"] .apexcharts-legend-text`).boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.evaluate((src) => {
    const before = document.querySelector('.apexcharts-legend-text')
    ;(0, eval)(`(${src})`)()
    window.__rebuilt = !before.isConnected
  }, update.toString())
  await advance(page, 100)
  await page.mouse.up()
  await advance(page, 1000)
  return page.evaluate(() => window.__rebuilt)
}

for (const [label, update] of Object.entries(UPDATES)) {
  test(`legend click toggles the series across an ${label} re-render`, async ({ page }) => {
    const errors = await mountChart(page, options)
    await page.evaluate((s) => (window.__next = s), series(7))
    await page.evaluate(() => {
      window.__clicks = 0
      window.chart.addEventListener('legendClick', () => window.__clicks++)
    })

    expect(await pressAcrossUpdate(page, 'Alpha', update)).toBe(true)
    expect(await collapsed(page)).toEqual([0])
    expect(await page.evaluate(() => window.__clicks)).toBe(1)

    // A plain click afterwards still shows the series again, once.
    await page.locator('.apexcharts-legend-series[seriesName="Alpha"] .apexcharts-legend-text').click()
    await advance(page, 1000)
    expect(await collapsed(page)).toEqual([])
    expect(await page.evaluate(() => window.__clicks)).toBe(2)
    expect(errors).toEqual([])
  })
}

test('legend tap across a re-render toggles once, not twice', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true })
  const page = await context.newPage()
  const errors = await mountChart(page, options)
  await page.evaluate((s) => (window.__next = s), series(7))

  const box = await page.locator('.apexcharts-legend-series[seriesName="Beta"] .apexcharts-legend-text').boundingBox()
  const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  const cdp = await context.newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] })
  await page.evaluate(() => window.chart.updateSeries(window.__next))
  await advance(page, 100)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await advance(page, 1000)

  expect(await collapsed(page)).toEqual([1])
  expect(errors).toEqual([])
  await context.close()
})
