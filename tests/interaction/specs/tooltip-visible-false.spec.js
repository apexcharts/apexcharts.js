/**
 * `tooltip.visible: false` (#5382): a page that draws its own hover details
 * keeps the chart's hit-testing and events, and the chart draws no tooltip.
 *
 * A real pointer sweeps a line chart (default nearest-point hover, markers
 * size 0, so there is no per-point node to hover) and clicks a point; the
 * chart's `mouseMove` and `click` must report each point's indices, and no
 * tooltip, x-axis tooltip or y-axis tooltip may ever be visible.
 */

import { test, expect } from '../fixtures/base.js'

/** Viewport position of series i, point j (nudged inward off the grid edge). */
async function pointXY(page, i, j) {
  return page.evaluate(
    ([si, di]) => {
      const gl = window.chart.w.globals
      const rect = document
        .querySelector('.apexcharts-svg')
        .getBoundingClientRect()
      return {
        x: rect.left + gl.translateX + gl.seriesXvalues[si][di] + (di ? 0 : 2),
        y: rect.top + gl.translateY + gl.seriesYvalues[si][di],
      }
    },
    [i, j],
  )
}

test.describe('tooltip.visible: false', () => {
  test('a swept line reports every point and shows no tooltip', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'basic-line')

    const count = await page.evaluate(async () => {
      window.__log = []
      const push = (name) => (_e, _c, o) =>
        window.__log.push([name, o.seriesIndex, o.dataPointIndex])
      await window.chart.updateOptions({
        chart: { events: { mouseMove: push('move'), click: push('click') } },
        tooltip: { visible: false, shared: false, intersect: false },
        yaxis: { tooltip: { enabled: true } },
      })
      return window.chart.w.globals.seriesXvalues[0].length
    })

    const indices = []
    for (let j = 0; j < count; j++) {
      const { x, y } = await pointXY(page, 0, j)
      await page.mouse.move(x, y)
      // Past the tooltip's 20ms draw coalescing, so each move is resolved.
      await page.waitForTimeout(40)
      await page.mouse.move(x, y + 1)
      const last = await page.evaluate(() =>
        window.__log.filter((r) => r[0] === 'move').pop(),
      )
      indices.push(last && [last[1], last[2]])
      // The box stays hidden while a point is captured.
      await expect(page.locator('.apexcharts-tooltip').first()).toBeHidden()
    }
    expect(indices).toEqual(
      Array.from({ length: count }, (_, j) => [0, j]),
    )

    const mid = Math.floor(count / 2)
    const { x, y } = await pointXY(page, 0, mid)
    await page.mouse.move(x, y)
    await page.waitForTimeout(40)
    await page.mouse.down()
    await page.mouse.up()
    const click = await page.evaluate(() =>
      window.__log.filter((r) => r[0] === 'click').pop(),
    )
    expect(click).toEqual(['click', 0, mid])

    // Neither axis tooltip is drawn at all.
    await expect(page.locator('.apexcharts-xaxistooltip')).toHaveCount(0)
    await expect(page.locator('.apexcharts-yaxistooltip')).toHaveCount(0)
    await expect(page.locator('.apexcharts-tooltip').first()).toBeHidden()
  })
})
