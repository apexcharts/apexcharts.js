/**
 * Line chart with `tooltip.shared: true` — clicking a marker should
 * report the series the user clicked, not always series 0.
 *
 * Background: a previous fix for #3439 (zoomed-bar shared tooltip)
 * skipped Y in closestInMultiArray whenever allSeriesHasEqualX was true.
 * That made every line-chart series tie at distance 0, so series 0
 * always won → markerClick always reported series 0 regardless of which
 * line the user clicked. The fix narrows the Y-skip to bar charts only;
 * line/area charts now use full Euclidean distance to identify the
 * actually-hovered series.
 *
 * Uses real `page.mouse.click` because synthetic dispatchEvent on a
 * marker would bypass the foreignObject overlay and silently mask the
 * bug. Marker click coordinates are taken from the marker's bounding
 * rect, so the click lands exactly on the series's marker.
 */

import { test, expect } from '../fixtures/base.js'

test('Shared tooltip — markerClick reports the clicked series', async ({
  page,
  loadChart,
}) => {
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

  // Use point 4 (May): 49, 70, 33, 55, 57 — values are spread enough that
  // each series's marker is unambiguously hit by clicking its own center.
  for (let s = 0; s < 5; s++) {
    const { x, y } = await page.evaluate((si) => {
      const m = document.querySelector(
        `.apexcharts-marker[index="${si}"][rel="4"]`,
      )
      const r = m.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }, s)
    await page.evaluate(() => (window.__events = []))
    await page.mouse.click(x, y)
    await page.waitForTimeout(80)
    const events = await page.evaluate(() => window.__events)
    expect(events[0], `no markerClick fired for series ${s}`).toBeTruthy()
    expect(events[0].seriesIndex).toBe(s)
    expect(events[0].dataPointIndex).toBe(4)
  }
})
