/**
 * Range area, an update morphs each band from where it was.
 *
 * Series.getPreviousPaths captured range-area bands, but the line renderer only
 * looked previous paths up for line and area, so a range area never found its
 * own: every update started all of its bands flat on the baseline and re-grew
 * them, the series that did not change included. Found by the legend-toggle
 * matrix (noJump); the same lookup serves a plain data update, pinned here.
 */

import { test, expect } from '@playwright/test'
import { mountChart, recordTransition, checkAll, settles, expectNoViolations } from '../helpers/frames.js'

const CATS = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6']
const band = (c, i, k = 1) => ({ x: CATS[i], y: [Math.round((30 + c * 25 + i * 4) * k), Math.round((50 + c * 25 + i * 6) * k)] })

function config() {
  return {
    chart: { type: 'rangeArea', height: 320, toolbar: { show: false }, animations: { dynamicAnimation: { speed: 350 } } },
    dataLabels: { enabled: false },
    series: ['Low', 'High'].map((name, c) => ({ name, data: CATS.map((_, i) => band(c, i)) })),
  }
}

test.describe('Range area transitions', () => {
  test('updateSeries morphs every band from its previous shape', async ({ page }) => {
    const errors = await mountChart(page, config())
    // Only High changes, and inside the current y range (its last point, which
    // sets the axis max, stays put), so the axis does not rescale. Low must
    // then not move at all, let alone re-grow.
    const next = (series) =>
      series.map((s, c) =>
        c === 1
          ? {
              name: s.name,
              data: s.data.map((p, i) => (i === s.data.length - 1 ? p : { x: p.x, y: [p.y[0] - 6, p.y[1] - 6] })),
            }
          : s,
      )
    const rec = await recordTransition(page, () =>
      page.evaluate((src) => window.chart.updateSeries((0, eval)(`(${src})`)(window.chart.w.config.series)), next.toString()),
    )

    expectNoViolations(checkAll(rec, { xStable: true }), 'updateSeries')
    // Low is untouched: every frame of it equals its first.
    const low = rec.frames.map((f) => JSON.stringify(f.series.find((s) => s.name === 'Low').marks.map((m) => m.pts)))
    expect(new Set(low).size, 'Low moved during an update that did not change it').toBe(1)
    expectNoViolations(
      await settles(page, rec, { transform: `(o) => ({ series: (${next})(o.series) })` }),
      'updateSeries at rest',
    )
    expect(errors).toEqual([])
  })
})
