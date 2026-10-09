/**
 * A line or area update that lands while the last one is still morphing
 * starts each series where it is on screen, not where the last update was
 * taking it. A re-send of the same data mid-flight used to snap every series
 * to its target on the first frame (and any other update started from that
 * target too).
 */

import { test, expect } from '@playwright/test'
import {
  mountChart,
  recordTransition,
  noJump,
  finite,
  settles,
  expectNoViolations,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const rows = (bump) => [
  { name: 'A', data: [12, 18, 9, 22, 15, 17].map((v) => v + bump) },
  { name: 'B', data: [5, 9, 14, 8, 11, 6].map((v) => v + bump) },
]

for (const type of ['line', 'area']) {
  for (const [what, next] of [
    ['the same data again', 8],
    ['new data', 3],
  ]) {
    test(`${type}: ${what} mid-flight starts from the screen`, async ({
      page,
    }) => {
      const errors = await mountChart(page, {
        chart: { type, height: 320, toolbar: { show: false } },
        dataLabels: { enabled: false },
        xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
        series: rows(0),
      })
      await page.evaluate((s) => window.chart.updateSeries(s), rows(8))
      await advance(page, 200)
      const rec = await recordTransition(page, () =>
        page.evaluate((s) => window.chart.updateSeries(s), rows(next)),
      )
      expectNoViolations(finite(rec))
      expectNoViolations(noJump(rec))
      await page.evaluate(
        (s) =>
          (window.__opts0 = {
            ...window.__frameLib.clone(window.__opts0),
            series: s,
          }),
        rows(next),
      )
      expectNoViolations(await settles(page, rec))
      expect(errors).toEqual([])
    })
  }
}
