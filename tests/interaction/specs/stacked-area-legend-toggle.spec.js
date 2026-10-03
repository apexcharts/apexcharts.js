/**
 * Stacked area and line, a series toggled from the legend must flatten onto
 * the layer beneath it, never slide off sideways.
 *
 * Hiding a stacked layer means its contribution goes to zero, so the right
 * exit is the layer pressing down onto its neighbour below across the whole
 * width of the plot, and showing it again is the reverse. For [[x, y]] data on
 * a datetime or numeric axis it used to do something else entirely: the
 * collapsed series carried no x values, so the morph target was a single point
 * and the whole layer shrank into the plot's bottom-left corner, sliding left
 * as it went. Start and end states looked fine (the series is not painted at
 * rest), which is why only a per-frame sample catches it.
 *
 * Every frame is checked against the shared animation rules (helpers/frames.js),
 * with xStable on: a legend toggle never changes the x axis here, so no series,
 * the departing one included, may change its x extent. On top of that, the
 * exit ends with the series lying exactly on the one below (or on the baseline
 * when it was the bottom layer), after which its shape is cleared.
 */

import { test, expect } from '@playwright/test'
import {
  mountChart,
  recordTransition,
  toggleLegend,
  checkAll,
  settles,
  expectNoViolations,
  probes,
  TOL,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const NAMES = ['Search', 'Social', 'Email', 'Referral']
const T0 = Date.UTC(2026, 8, 4)
const DAY = 864e5
const N = 30
const SPEED = 350

/**
 * @param {{ format: 'pairs' | 'objects' | 'categories', xType?: string,
 *   type?: string, curve?: string, hidden?: string }} opts
 */
function config({ format, xType = 'datetime', type = 'area', curve = 'smooth', hidden }) {
  const xOf = (d) => (xType === 'numeric' ? d * 10 : T0 + d * DAY)
  const yOf = (c, d) =>
    Math.round(
      (900 - c * 180) * (1 + 0.25 * Math.sin((d + c * 3) / 4)) * (d % 7 >= 5 ? 0.7 : 1),
    )
  return {
    chart: {
      type,
      height: 300,
      stacked: true,
      toolbar: { show: false },
      animations: { dynamicAnimation: { speed: SPEED } },
    },
    dataLabels: { enabled: false },
    stroke: { curve, width: 2 },
    legend: { position: 'top' },
    series: NAMES.map((name, c) => ({
      name,
      hidden: hidden === name,
      data: Array.from({ length: N }, (_, d) =>
        format === 'pairs'
          ? [xOf(d), yOf(c, d)]
          : format === 'objects'
            ? { x: xOf(d), y: yOf(c, d) }
            : yOf(c, d),
      ),
    })),
    xaxis:
      format === 'categories'
        ? { categories: Array.from({ length: N }, (_, d) => `D${d + 1}`) }
        : { type: xType },
  }
}

const CASES = [
  { title: '[x, y] pairs, datetime x', opts: { format: 'pairs' } },
  { title: '[x, y] pairs, numeric x', opts: { format: 'pairs', xType: 'numeric' } },
  { title: '[x, y] pairs, straight curve', opts: { format: 'pairs', curve: 'straight' } },
  { title: '[x, y] pairs, stacked line', opts: { format: 'pairs', type: 'line' } },
  { title: '{x, y} objects, datetime x', opts: { format: 'objects' } },
  { title: 'category axis', opts: { format: 'categories' } },
]

for (const { title, opts } of CASES) {
  test.describe(`Stacked legend toggle, ${title}`, () => {
    // A middle layer (has a neighbour below) and the bottom layer (flattens
    // onto the axis baseline).
    for (const [name, below] of [
      ['Social', 'Search'],
      ['Search', null],
    ]) {
      test(`hiding ${name} flattens it onto ${below ?? 'the baseline'}`, async ({ page }) => {
        const errors = await mountChart(page, config(opts))
        const rec = await recordTransition(page, () => toggleLegend(page, name), {
          probe: probes.gapToBelow,
          probeArg: { name, below },
        })

        expectNoViolations(checkAll(rec, { xStable: true }), `hide ${name}`)
        // Where the exit ended: the last frame that still drew the series.
        // After that its shape is cleared and nothing is left to measure.
        const gaps = rec.probes.filter((g) => g != null)
        expect(gaps.length, 'the series never drew an exit').toBeGreaterThan(0)
        expect(gaps[gaps.length - 1]).toBeLessThan(TOL)
        expectNoViolations(await settles(page, rec, { hidden: [name] }), `hide ${name} at rest`)
        expect(errors).toEqual([])
      })

      test(`showing ${name} again rises from ${below ?? 'the baseline'}`, async ({ page }) => {
        const errors = await mountChart(page, config(opts))
        await toggleLegend(page, name)
        await advance(page, 4000)
        const rec = await recordTransition(page, () => toggleLegend(page, name))

        expectNoViolations(checkAll(rec, { xStable: true }), `show ${name}`)
        expectNoViolations(await settles(page, rec), `show ${name} at rest`)
        expect(errors).toEqual([])
      })
    }
  })
}

test.describe('Stacked legend toggle, a series declared hidden in the config', () => {
  test('showing it rises from the layer below across the full width', async ({ page }) => {
    const errors = await mountChart(page, config({ format: 'pairs', hidden: 'Social' }))
    const rec = await recordTransition(page, () => toggleLegend(page, 'Social'))

    expectNoViolations(checkAll(rec, { xStable: true }), 'show config-hidden Social')
    expect(errors).toEqual([])
  })
})
