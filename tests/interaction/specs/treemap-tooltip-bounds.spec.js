/**
 * Treemap tooltip — stays inside the plot area.
 *
 * A treemap tooltip uses the legacy beside-the-cell placement, which offsets
 * the box by its own width. With a long label on a narrow chart that offset
 * pushes the box past the left edge of the plot area, so most of the text ends
 * up off-screen (issue #5121). The placement is now clamped horizontally, the
 * same way the arrow-mode heatmap path is.
 *
 * The vertical half had the same shape of bug (issue #5321): the two height
 * terms that centre the box on the tile were swapped, and the grid's own offset
 * inside the chart was never added back, so a tall tile threw the tooltip half
 * a tile above the plot area, and off the top of the page on a chart near it.
 * The second test pins the box to the tile's vertical centre.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const BUNDLE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../dist/apexcharts.js',
)

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

  test('sits level with the hovered tile, not above the chart', async ({
    page,
  }) => {
    // A bare page rather than a sample: the spacer above the chart is what
    // turns "half a tile too high" into "off the top of the viewport".
    await page.setContent(`
      <div style="height:150px"></div>
      <div id="chart" style="width:380px"></div>
    `)
    await page.addScriptTag({ path: BUNDLE })
    await page.evaluate(() => {
      window.chart = new window.ApexCharts(document.querySelector('#chart'), {
        chart: { type: 'treemap', height: 240, animations: { enabled: false } },
        series: [{ data: [{ x: 'Tom', y: 35 }, { x: 'Olive', y: 15 }] }],
        tooltip: { followCursor: false },
      })
      return window.chart.render()
    })

    const cells = page.locator('.apexcharts-treemap-rect')
    const count = await cells.count()
    expect(count).toBeGreaterThan(0)

    for (let j = 0; j < count; j++) {
      await cells.nth(j).hover({ force: true })
      await page.waitForSelector('.apexcharts-tooltip.apexcharts-active', {
        timeout: 3_000,
      })

      const b = await page.evaluate((j) => {
        const cell = document.querySelectorAll('.apexcharts-treemap-rect')[j]
        const tt = document.querySelector('.apexcharts-tooltip')
        const grid = document.querySelector('.apexcharts-inner')
        const cr = cell.getBoundingClientRect()
        const tr = tt.getBoundingClientRect()
        const gr = grid.getBoundingClientRect()
        return {
          offCentre: (tr.top + tr.bottom) / 2 - (cr.top + cr.bottom) / 2,
          ttTop: tr.top,
          ttBottom: tr.bottom,
          ttHeight: tr.height,
          gridTop: gr.top,
          gridBottom: gr.bottom,
        }
      }, j)

      // The tile is 220px tall and the box ~43px, so the old swapped terms put
      // this ~88px above the tile's top edge and 108px above the plot area.
      expect(
        Math.abs(b.offCentre),
        `tile ${j}: tooltip is not level with the tile`,
      ).toBeLessThanOrEqual(1)

      if (b.ttHeight <= b.gridBottom - b.gridTop) {
        expect(
          b.ttTop,
          `tile ${j}: tooltip starts above the plot area`,
        ).toBeGreaterThanOrEqual(b.gridTop - 1)
        expect(
          b.ttBottom,
          `tile ${j}: tooltip ends below the plot area`,
        ).toBeLessThanOrEqual(b.gridBottom + 1)
      }

      await page.mouse.move(2, 2)
      await page.waitForTimeout(50)
    }
  })
})
