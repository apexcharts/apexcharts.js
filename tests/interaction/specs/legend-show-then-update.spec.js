/**
 * Once a series shown from the legend has risen, it is an ordinary series.
 *
 * `globals.risingSeries` names the series a legend click is showing, for the
 * render that shows it. It used to stay set until the next legend click, so
 * every later update treated the series as rising again: a scatter's points
 * shrank to nothing and grew back on each data refresh, and updateSeries
 * never took its fast path.
 */

import { test, expect } from '@playwright/test'
import { mountChart, recordTransition, toggleLegend, noJump, expectNoViolations } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const series = (s) =>
  ['Alpha', 'Beta'].map((name, k) => ({
    name,
    data: [1, 2, 3, 4].map((x) => [x, 10 + k * 8 + ((x * 5 + s * 3) % 7)]),
  }))

test('scatter: an update after showing a series moves its points, it does not regrow them', async ({ page }) => {
  const errors = await mountChart(page, {
    chart: { type: 'scatter', height: 300, animations: { dynamicAnimation: { speed: 350 } } },
    legend: { show: true },
    series: series(0),
    xaxis: { type: 'numeric' },
  })
  await toggleLegend(page, 'Beta')
  await advance(page, 1500)
  await toggleLegend(page, 'Beta')
  await advance(page, 1500)
  expect(await page.evaluate(() => window.chart.w.globals.risingSeries)).toEqual([])

  const rec = await recordTransition(page, () => page.evaluate((s) => window.chart.updateSeries(s), series(1)))
  expectNoViolations(noJump(rec), 'frame 0 after the update')
  expect(errors).toEqual([])
})
