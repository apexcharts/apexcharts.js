/**
 * The way back out of a zoom, in a browser.
 *
 * `tests/unit/zoom-reset-control.spec.js` drives the same feature through
 * `zoomX()`, which sets the zoomed state without anyone touching the chart.
 * What only a browser answers is the case the feature exists for: a real drag
 * across a real plot on a chart whose page hid the toolbar. The viewer zooms in,
 * and until this the only ways back were a page reload and a key nobody knows.
 *
 * Fixture: samples/vanilla-js/line/zoomable-timeseries.html
 *   - window.chart = the chart, on a datetime x with zoom enabled
 */

import { test, expect } from '../fixtures/base.js'
import { getXRange } from '../helpers/chart.js'

const CHART = 'line'
const FIXTURE = 'zoomable-timeseries'

const resetControl = (page) => page.locator('.apexcharts-reset-icon')
const toolbar = (page) => page.locator('.apexcharts-toolbar')

/** Take the toolbar away, as a page embedding a chart in its own UI does. */
async function hideToolbar(page) {
  await page.evaluate(() =>
    window.chart.updateOptions({ chart: { toolbar: { show: false } } }),
  )
  await expect(toolbar(page)).toHaveCount(0)
}

/**
 * Drag across the middle of the plot, which is what zooms a chart in the
 * absence of any toolbar: the gesture is deliberate, so it is not withheld the
 * way the wheel and the pinch are.
 */
async function dragZoom(page) {
  const box = await page.locator('.apexcharts-inner').boundingBox()
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.3, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.6, y, { steps: 10 })
  await page.mouse.up()
}

test.describe('a zoom on a chart with no toolbar', () => {
  test('offers a reset control, which puts the range back', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await hideToolbar(page)
    const full = await getXRange(page)

    await dragZoom(page)

    // The control arrives with the zoom: polled rather than waited for, since
    // the render that draws it rides the same animation the zoom does.
    await expect(resetControl(page)).toHaveCount(1)
    await expect
      .poll(async () => (await getXRange(page)).minX)
      .toBeGreaterThan(full.minX)

    await resetControl(page).click()

    await expect.poll(async () => getXRange(page)).toEqual(full)
    // And it goes with the zoom, so the page is back to the bare chart it asked
    // for rather than carrying a button that now does nothing.
    await expect(resetControl(page)).toHaveCount(0)
  })

  test('resets on Escape, for the viewer who never looks for a button', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await hideToolbar(page)
    const full = await getXRange(page)

    await dragZoom(page)
    await expect
      .poll(async () => (await getXRange(page)).minX)
      .toBeGreaterThan(full.minX)

    // No click on the control first: the drag itself leaves focus inside the
    // chart, which is what puts the key within reach.
    await page.keyboard.press('Escape')

    await expect.poll(async () => getXRange(page)).toEqual(full)
    await expect(resetControl(page)).toHaveCount(0)
  })

  test('draws nothing at all until something zooms', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await hideToolbar(page)

    // The promise `toolbar: { show: false }` makes, and the reason the control
    // is drawn on the zoom rather than on every render.
    await expect(resetControl(page)).toHaveCount(0)
    await expect(toolbar(page)).toHaveCount(0)
  })
})
