/**
 * Wheel zoom is only offered when the zoom can be undone.
 *
 * Regression for: a chart with `toolbar: { show: false }` still zoomed on the
 * mouse wheel and preventDefault'd the event, so scrolling the page over the
 * chart left the viewer in a zoomed window with no reset button to get out of
 * it (found on the histogram latency-distribution demo). `allowMouseWheelZoom`
 * now defaults to 'auto': bound only when the toolbar's reset button is there.
 * An explicit `true` still forces it on, for pages that supply their own reset.
 *
 * Asserts both halves of the symptom: the x-window does not move, AND the wheel
 * event is left cancelable so the page scrolls normally.
 *
 * Fixture: samples/vanilla-js/line/zoom-pan-selection.html
 */

import { test, expect } from '../fixtures/base.js'
import { getXRange } from '../helpers/chart.js'

const CHART = 'line'
const FIXTURE = 'zoom-pan-selection'

/** Dispatch one cancelable wheel notch over the grid; report if it was eaten. */
async function wheelWasConsumed(page, deltaY) {
  const consumed = await page.evaluate((dy) => {
    const svg = document.querySelector('.apexcharts-svg')
    const rect = svg.getBoundingClientRect()
    const e = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      deltaY: dy,
    })
    svg.dispatchEvent(e)
    return e.defaultPrevented
  }, deltaY)
  await page.waitForTimeout(300)
  return consumed
}

async function applyOptions(page, options) {
  await page.evaluate((o) => window.chart.updateOptions(o), options)
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 5_000 },
  )
}

test.describe("Wheel zoom needs a way back ('auto')", () => {
  test('a hidden toolbar leaves the wheel alone: no zoom, page still scrolls', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await applyOptions(page, {
      chart: { toolbar: { show: false }, zoom: { enabled: true } },
    })

    const before = await getXRange(page)
    const consumed = await wheelWasConsumed(page, -100)
    const after = await getXRange(page)

    expect(consumed).toBe(false)
    expect(after.minX).toBe(before.minX)
    expect(after.maxX).toBe(before.maxX)
  })

  test('explicit true still zooms with the toolbar hidden', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await applyOptions(page, {
      chart: {
        toolbar: { show: false },
        zoom: { enabled: true, allowMouseWheelZoom: true },
      },
    })

    const before = await getXRange(page)
    const consumed = await wheelWasConsumed(page, -100)
    const after = await getXRange(page)

    expect(consumed).toBe(true)
    expect(after.maxX - after.minX).toBeLessThan(before.maxX - before.minX)
  })
})
