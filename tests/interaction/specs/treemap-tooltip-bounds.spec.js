/**
 * Treemap tooltip — stays inside the plot area.
 *
 * A treemap tooltip uses the legacy beside-the-cell placement, which offsets
 * the box by its own width. With a long label on a narrow chart that offset
 * pushes the box past the left edge of the plot area, so most of the text ends
 * up off-screen (issue #5121). The placement is now clamped horizontally, the
 * same way the arrow-mode heatmap path is.
 */

import { test, expect } from '../fixtures/base.js'

// Narrow viewport so the tooltip is wider than the space beside a cell.
test.use({ viewport: { width: 420, height: 700 } })

const LONG_LABELS = [
  { x: 'Alphabet Incorporated Class A', y: 218 },
  { x: 'Microsoft Corporation Holdings', y: 149 },
  { x: 'International Business Machines', y: 184 },
  { x: 'Advanced Micro Devices Included', y: 55 },
  { x: 'Amazon Web Services Global Unit', y: 84 },
  { x: 'Meta Platforms Incorporated Ltd', y: 31 },
]

/** Replace the sample data with labels long enough to overflow. */
async function useLongLabels(page) {
  await page.evaluate((data) => {
    window.chart.updateSeries([{ data }])
  }, LONG_LABELS)
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 5_000 },
  )
}

/** Tooltip box and plot-area bounds, in viewport coordinates. */
async function readBounds(page) {
  return page.evaluate(() => {
    const tt = document.querySelector('.apexcharts-tooltip')
    const grid = document.querySelector('.apexcharts-inner')
    const tr = tt.getBoundingClientRect()
    const gr = grid.getBoundingClientRect()
    return {
      ttLeft: tr.left,
      ttRight: tr.right,
      ttWidth: tr.width,
      gridLeft: gr.left,
      gridRight: gr.right,
      viewportWidth: window.innerWidth,
    }
  })
}

test.describe('Treemap tooltip bounds', () => {
  test('never hangs off the left edge of the plot area', async ({
    page,
    loadChart,
  }) => {
    await loadChart('treemap', 'basic')
    await useLongLabels(page)

    const cells = page.locator('.apexcharts-treemap-rect')
    const count = await cells.count()
    expect(count).toBeGreaterThan(0)

    for (let j = 0; j < count; j++) {
      await cells.nth(j).hover({ force: true })
      await page.waitForSelector('.apexcharts-tooltip.apexcharts-active', {
        timeout: 3_000,
      })

      const b = await readBounds(page)

      // The box is only clamped when it is narrower than the plot area; a
      // tooltip wider than the chart itself cannot fit by definition.
      if (b.ttWidth <= b.gridRight - b.gridLeft) {
        // 1px tolerance for sub-pixel rounding of the CSS left offset.
        expect(
          b.ttLeft,
          `cell ${j}: tooltip starts left of the plot area`,
        ).toBeGreaterThanOrEqual(b.gridLeft - 1)
        expect(
          b.ttRight,
          `cell ${j}: tooltip ends right of the plot area`,
        ).toBeLessThanOrEqual(b.gridRight + 1)
      }

      // Whatever the width, the box must stay on screen.
      expect(b.ttLeft, `cell ${j}: tooltip is off-screen`).toBeGreaterThanOrEqual(-1)

      // Move away so the next hover re-fires the tooltip.
      await page.mouse.move(2, 2)
      await page.waitForTimeout(50)
    }
  })
})
