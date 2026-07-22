/**
 * Regression: chart.resetSeries() must reset the *rendered* x/y axes back to
 * their un-zoomed range, matching the toolbar "Reset zoom" button.
 *
 * History: this broke in v5.10.4 (resetSeries reset the internal minX/maxX but
 * the drawn axis labels stayed at the zoomed window) and was fixed by the 6.0
 * update-path rework. This spec guards against the axis re-render silently
 * regressing again — asserting on w.globals.minX/maxX alone would NOT have
 * caught the original bug because those were already correct while the DOM
 * labels were stale, so we assert on the rendered tick labels.
 *
 * Fixture: samples/vanilla-js/line/zoom-pan-selection.html
 *   - numeric line chart, x spans 1..60, zoom type='x', animations disabled.
 */

import { test, expect } from '../fixtures/base.js'
import { dragOnChart, getXRange } from '../helpers/chart.js'

const CHART = 'line'
const FIXTURE = 'zoom-pan-selection'

async function getGridLayout(page) {
  return page.evaluate(() => {
    const w = window.chart.w
    return {
      gridWidth: w.layout.gridWidth,
      gridHeight: w.layout.gridHeight,
      translateX: w.layout.translateX,
      translateY: w.layout.translateY,
      initialMinX: w.globals.initialMinX,
      initialMaxX: w.globals.initialMaxX,
    }
  })
}

/**
 * Read the numeric value of every rendered x-axis tick label. Each label is
 * `<text><tspan>NN</tspan><title>NN</title></text>` so textContent doubles the
 * value — read the tspan to get the clean number.
 */
async function renderedXTicks(page) {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('.apexcharts-xaxis-label'))
      .map((n) => n.querySelector('tspan')?.textContent ?? '')
      .map((t) => parseFloat(t))
      .filter((n) => !Number.isNaN(n)),
  )
}

test('resetSeries() un-zooms the rendered x-axis (not just minX/maxX)', async ({
  page,
  loadChart,
}) => {
  await loadChart(CHART, FIXTURE)
  const layout = await getGridLayout(page)

  // Zoom into a narrow window in the middle of the chart.
  const startX = layout.translateX + layout.gridWidth * 0.35
  const endX = layout.translateX + layout.gridWidth * 0.6
  const midY = layout.translateY + layout.gridHeight / 2

  await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })
  await page.waitForFunction(() => window.chart.w.interact.zoomed === true, {
    timeout: 3_000,
  })

  // While zoomed, no rendered tick should reach the full-range max — the whole
  // point of the zoom is that the far end (~60) is off-screen.
  const zoomedTicks = await renderedXTicks(page)
  expect(zoomedTicks.length).toBeGreaterThan(0)
  expect(Math.max(...zoomedTicks)).toBeLessThan(layout.initialMaxX * 0.75)

  // Reset via the PUBLIC API (not the toolbar button).
  await page.evaluate(() => window.chart.resetSeries())
  await page.waitForFunction(
    () => window.chart.w.globals.animationEnded === true,
    { timeout: 5_000 },
  )

  // Internal domain is restored...
  const { minX, maxX } = await getXRange(page)
  expect(minX).toBeCloseTo(layout.initialMinX, -1)
  expect(maxX).toBeCloseTo(layout.initialMaxX, -1)

  // ...AND the rendered axis is redrawn to span the full range again. This is
  // the assertion that fails on the buggy 5.10.4 build (labels stayed at the
  // zoomed window) but passes once the axis re-renders on reset.
  const resetTicks = await renderedXTicks(page)
  expect(Math.max(...resetTicks)).toBeGreaterThan(layout.initialMaxX * 0.9)
  expect(Math.min(...resetTicks)).toBeLessThanOrEqual(layout.initialMinX + 1)
})

test('resetSeries() matches the toolbar reset button after a drag zoom', async ({
  page,
  loadChart,
}) => {
  // Same zoom gesture, reset two ways, assert the rendered axes agree.
  const zoomAndSnap = async (resetFn) => {
    await loadChart(CHART, FIXTURE)
    const layout = await getGridLayout(page)
    const startX = layout.translateX + layout.gridWidth * 0.35
    const endX = layout.translateX + layout.gridWidth * 0.6
    const midY = layout.translateY + layout.gridHeight / 2
    await dragOnChart(page, { x: startX, y: midY }, { x: endX, y: midY })
    await page.waitForFunction(() => window.chart.w.interact.zoomed === true, {
      timeout: 3_000,
    })
    await resetFn()
    await page.waitForTimeout(300)
    return renderedXTicks(page)
  }

  const viaResetSeries = await zoomAndSnap(() =>
    page.evaluate(() => window.chart.resetSeries()),
  )
  const viaToolbar = await zoomAndSnap(() =>
    page.evaluate(() => window.chart.toolbar.handleZoomReset()),
  )

  expect(viaResetSeries).toEqual(viaToolbar)
})
