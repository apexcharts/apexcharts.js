/**
 * Line chart with `tooltip.shared: true` — click events must report the
 * series the user actually clicked, not always series 0.
 *
 * Two distinct bugs converge here:
 *   1. The fix for #3439 (zoomed-bar shared tooltip) made
 *      closestInMultiArray skip Y whenever allSeriesHasEqualX was true.
 *      That tied every line series at distance X = 0, so series 0 always
 *      won. The Y-skip is now narrowed to bar charts only.
 *   2. Even before #3439, closestInMultiArray measured distance to each
 *      series's *markers* rather than its *line segments*. Clicks landing
 *      between two markers picked whichever series's marker was closest
 *      to that empty space — often the wrong line. For line/area charts
 *      we now project the cursor onto each segment, which makes clicks
 *      on the line itself report the line under the cursor.
 *
 * Real `page.mouse.click` is used throughout — synthetic dispatchEvent
 * on a marker bypasses the foreignObject hover overlay and would
 * silently mask the bug.
 */

import { test, expect } from '../fixtures/base.js'

async function loadDemo(page, loadChart) {
  await loadChart('line', 'shared-tooltip-click')
  await page.evaluate(() => {
    window.__events = []
    window.chart.updateOptions({
      chart: {
        events: {
          markerClick: (_e, _ctx, cfg) => {
            window.__events.push({
              seriesIndex: Number(cfg.seriesIndex),
              dataPointIndex: Number(cfg.dataPointIndex),
            })
          },
        },
      },
    })
  })
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 5_000 },
  )
}

async function clickAt(page, x, y) {
  await page.evaluate(() => (window.__events = []))
  await page.mouse.click(x, y)
  await page.waitForTimeout(80)
  return page.evaluate(() => window.__events)
}

test.describe('Shared tooltip — click reports correct series', () => {
  test('clicking each series marker reports that series index', async ({
    page,
    loadChart,
  }) => {
    await loadDemo(page, loadChart)

    // Point 4 (May): 49, 70, 33, 55, 57 — values are spread enough that
    // each series's marker is unambiguously hit by clicking its own center.
    for (let s = 0; s < 5; s++) {
      const { x, y } = await page.evaluate((si) => {
        const m = document.querySelector(
          `.apexcharts-marker[index="${si}"][rel="4"]`,
        )
        const r = m.getBoundingClientRect()
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      }, s)
      const events = await clickAt(page, x, y)
      expect(events[0], `no markerClick fired for series ${s}`).toBeTruthy()
      expect(events[0].seriesIndex).toBe(s)
      expect(events[0].dataPointIndex).toBe(4)
    }
  })

  test('clicking on a line between markers reports the clicked line', async ({
    page,
    loadChart,
  }) => {
    await loadDemo(page, loadChart)
    // Hide markers so the click coordinates fall on the line itself —
    // mirrors the original user report where clicks landed on the colored
    // line segment, not on a data point.
    await page.evaluate(() =>
      window.chart.updateOptions({ markers: { size: 0 } }),
    )
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    // Click midway between data points 3 and 4 of each series. Series 3
    // is the historically tricky one: its midpoint sits very close to
    // series 0's marker, so a marker-distance algorithm would
    // misidentify it as series 0.
    for (let s = 0; s < 5; s++) {
      const pos = await page.evaluate((si) => {
        const gl = window.chart.w.globals
        const svg = document.querySelector('.apexcharts-svg')
        const rect = svg.getBoundingClientRect()
        const x =
          gl.translateX +
          (gl.seriesXvalues[si][3] + gl.seriesXvalues[si][4]) / 2
        const y =
          gl.translateY +
          (gl.seriesYvalues[si][3] + gl.seriesYvalues[si][4]) / 2
        return { x: rect.left + x, y: rect.top + y }
      }, s)
      const events = await clickAt(page, pos.x, pos.y)
      expect(events[0], `no markerClick fired for line ${s}`).toBeTruthy()
      expect(events[0].seriesIndex).toBe(s)
    }
  })
})
