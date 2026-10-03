/**
 * Stacked bar/column, the stack must stay closed for the whole transition.
 *
 * A stacked chart draws its layers edge to edge, so every frame of an update is
 * only correct if the seam between two neighbouring segments stays shut. Three
 * separate defects used to tear it open, all of them invisible in a
 * before/after snapshot because start and end states were always right:
 *
 *   1. Layers were staggered against each other on updates, so a segment moved
 *      before the one beneath it had finished.
 *   2. A series hidden from the legend was blanked on the first frame while its
 *      marks kept their old slot for the length of the exit tween, leaving a
 *      hole the size of the outgoing layer.
 *   3. A layer whose rounded-corner state flipped (it became, or stopped being,
 *      the top/bottom of its stack) could not be morphed and snapped straight
 *      to its final slot while the rest of the stack was still sliding.
 *
 * Every frame is stepped on virtual time and measured by the seamGap probe,
 * and checked against the shared animation rules (helpers/frames.js).
 */

import { test, expect } from '@playwright/test'
import {
  loadSample,
  recordTransition,
  checkAll,
  settles,
  expectNoViolations,
  probes,
} from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

// stacked-column draws a 1px-free stack, so any gap is a real tear. The
// horizontal sample sets stroke.width 1 with white dividers, so its seams sit
// one pixel apart by design.
const COLUMN_TOLERANCE = 1.5
const BAR_TOLERANCE = 2.5

const legend = (page, index) => () => page.locator('.apexcharts-legend-series').nth(index).click()
const seriesName = (page, index) =>
  page.locator('.apexcharts-legend-series').nth(index).getAttribute('seriesName')
const worst = (rec) => Math.max(...rec.probes)

test.describe('Stacked column, seams stay closed through a legend toggle', () => {
  // Every layer, because only the outermost ones flip their rounded corners
  // when a neighbour disappears (this sample sets borderRadius 10 +
  // a stacked chart rounds only the outermost segment of each stack).
  for (const [index, name] of [
    [0, 'Phones'],
    [1, 'Tablets'],
    [2, 'Laptops'],
    [3, 'Wearables'],
  ]) {
    test(`hiding ${name} never opens a gap in the stack`, async ({ page }) => {
      const errors = await loadSample(page, 'column', 'stacked-column')
      const rec = await recordTransition(page, legend(page, index), { probe: probes.seamGap })

      expect(worst(rec)).toBeLessThan(COLUMN_TOLERANCE)
      expectNoViolations(checkAll(rec), `hide ${name}`)
      expectNoViolations(
        await settles(page, rec, { hidden: [await seriesName(page, index)] }),
        `hide ${name} at rest`,
      )
      expect(errors).toEqual([])
    })

    test(`showing ${name} again never opens a gap in the stack`, async ({ page }) => {
      const errors = await loadSample(page, 'column', 'stacked-column')
      await legend(page, index)()
      await advance(page, 4000)
      const rec = await recordTransition(page, legend(page, index), { probe: probes.seamGap })

      expect(worst(rec)).toBeLessThan(COLUMN_TOLERANCE)
      expectNoViolations(checkAll(rec), `show ${name}`)
      expectNoViolations(await settles(page, rec), `show ${name} at rest`)
      expect(errors).toEqual([])
    })
  }
})

test.describe('Stacked bar (horizontal), seams stay closed through a legend toggle', () => {
  for (const [index, label] of [
    [1, 'a middle'],
    [4, 'the last'],
  ]) {
    test(`hiding ${label} series never opens a gap in the stack`, async ({ page }) => {
      const errors = await loadSample(page, 'bar', 'stacked-bar')
      const rec = await recordTransition(page, legend(page, index), {
        probe: probes.seamGap,
        probeArg: true,
      })

      expect(worst(rec)).toBeLessThan(BAR_TOLERANCE)
      expectNoViolations(checkAll(rec), `hide ${label}`)
      expectNoViolations(
        await settles(page, rec, { hidden: [await seriesName(page, index)] }),
        `hide ${label} at rest`,
      )
      expect(errors).toEqual([])
    })
  }
})

test.describe('Stacked column, seams stay closed through a value update', () => {
  test('updateSeries moves every layer on one clock', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    const scale = (series) =>
      series.map((s, i) => ({
        name: s.name,
        data: s.data.map((v) => Math.max(3, Math.round(v * (i === 0 ? 0.5 : 1.6)))),
      }))
    const rec = await recordTransition(
      page,
      () => page.evaluate((src) => window.chart.updateSeries((0, eval)(`(${src})`)(window.chart.w.config.series)), scale.toString()),
      { probe: probes.seamGap },
    )

    expect(worst(rec)).toBeLessThan(COLUMN_TOLERANCE)
    expectNoViolations(checkAll(rec), 'updateSeries')
    expectNoViolations(
      await settles(page, rec, { transform: `(o) => ({ series: (${scale})(o.series) })` }),
      'updateSeries at rest',
    )
    expect(errors).toEqual([])
  })
})
