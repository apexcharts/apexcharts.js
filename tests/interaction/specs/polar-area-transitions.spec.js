/**
 * Polar area, an update grows each slice from the radius it was drawn at.
 *
 * The radius is polarArea's value channel. On an update it was rebuilt from
 * the previous VALUES divided by the raw max, but with the default
 * grid.position 'back' the polar grid is drawn first and rounds maxY up to a
 * nice max (44 becomes 50), so every slice started ~14% too large and jumped
 * on the first frame of any update, a legend toggle included. The draw now
 * stashes the radii it used (globals.prevPolarSizes) and the next update
 * starts from those. Found by the legend-toggle matrix (noJump).
 *
 * grid.position 'front' draws the grid after the slices, so there the raw max
 * WAS the scale: it pins that the stash agrees with the old rebuild where the
 * rebuild was right.
 */

import { test, expect } from '@playwright/test'
import { mountChart, recordTransition, checkAll, expectNoViolations } from '../helpers/frames.js'

const LABELS = ['Alpha', 'Beta', 'Gamma', 'Delta']

function config(position) {
  return {
    chart: { type: 'polarArea', height: 340, toolbar: { show: false }, animations: { dynamicAnimation: { speed: 350 } } },
    dataLabels: { enabled: false },
    grid: { position },
    series: [44, 33, 23, 17],
    labels: LABELS,
  }
}

for (const position of ['back', 'front']) {
  test.describe(`Polar area transitions, grid.position '${position}'`, () => {
    test('updateSeries starts every slice from its drawn radius', async ({ page }) => {
      const errors = await mountChart(page, config(position))
      const rec = await recordTransition(page, () => page.evaluate(() => window.chart.updateSeries([30, 41, 23, 9])))

      expectNoViolations(checkAll(rec), `updateSeries, grid ${position}`)
      expect(errors).toEqual([])
    })
  })
}
