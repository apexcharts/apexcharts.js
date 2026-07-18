/**
 * Linked Views (#4, highlight mode) brush-edge regression tests.
 *
 * Uses the linked-views-crossfilter fixture (a datetime bar chart with
 * chart.link.enabled + selection.enabled). Brushing a range dims the marks
 * whose x falls outside it. The brush clamps to the axis extent, but the
 * pixel->data round-trip used to leave the range min a few ms above the first
 * data point, so the first (or last) column could never be included even when
 * the brush visibly covered it ("can't select past the first column"). These
 * tests lock the edge-inclusion fix while proving a mid-range brush still
 * excludes the boundary marks (no over-inclusion).
 */

import { test, expect } from '../fixtures/base.js'

const DIMMED = 'apexcharts-crossfilter-dimmed'

// Drag a selection across the orders grid between two horizontal fractions,
// then read whether the first / last bar ended up dimmed.
async function brush(page, fromFrac, toFrac) {
  const geo = await page.evaluate(() => {
    const g = window.chart.el
      .querySelector('.apexcharts-grid')
      .getBoundingClientRect()
    return { gl: g.left, gt: g.top, gw: g.width, gh: g.height }
  })
  const y = geo.gt + geo.gh * 0.5
  await page.mouse.move(geo.gl + geo.gw * fromFrac, y)
  await page.mouse.down()
  await page.mouse.move(geo.gl + geo.gw * ((fromFrac + toFrac) / 2), y, { steps: 4 })
  await page.mouse.move(geo.gl + geo.gw * toFrac, y, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(150)
  return page.evaluate((DIMMED) => {
    const bars = Array.from(
      window.chart.el.querySelectorAll('.apexcharts-bar-area'),
    )
    const dim = (b) => b.classList.contains(DIMMED)
    return { first: dim(bars[0]), last: dim(bars[bars.length - 1]) }
  }, DIMMED)
}

test.describe('Linked views: brush highlight edges', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'linked-views-crossfilter')
  })

  test('brushing to the left edge includes the first mark', async ({ page }) => {
    const r = await brush(page, 0.55, 0)
    expect(r.first).toBe(false) // first column is inside the brush, not dimmed
    expect(r.last).toBe(true) // the far side stays dimmed
  })

  test('brushing to the right edge includes the last mark', async ({ page }) => {
    const r = await brush(page, 0.45, 1)
    expect(r.last).toBe(false)
    expect(r.first).toBe(true)
  })

  test('a mid-range brush still dims both boundary marks (no over-inclusion)', async ({
    page,
  }) => {
    const r = await brush(page, 0.35, 0.65)
    expect(r.first).toBe(true)
    expect(r.last).toBe(true)
  })
})
