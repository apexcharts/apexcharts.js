/**
 * Overlay Compare (#18) - measure ruler interaction tests.
 *
 * Uses the overlay-compare-measure fixture (line chart, chart.measure.enabled).
 * Exercises the real gesture path with browser events the jsdom unit env can't:
 *   - arming lays a capture pane; a drag draws a live ruler then pins it
 *   - the `measured` event reports the data-space deltas
 *   - a pinned ruler re-projects (stays data-anchored) across a re-render
 */

import { test, expect } from '../fixtures/base.js'

// Drag A->B across the plot's capture pane; returns nothing (assert via DOM/state).
async function dragMeasure(page, fracAx, fracAy, fracBx, fracBy) {
  await page.evaluate(
    ({ fracAx, fracAy, fracBx, fracBy }) => {
      const pane = window.chart.el.querySelector('.apexcharts-measure-capture')
      const r = pane.getBoundingClientRect()
      const ax = r.left + r.width * fracAx
      const ay = r.top + r.height * fracAy
      const bx = r.left + r.width * fracBx
      const by = r.top + r.height * fracBy
      pane.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window, clientX: ax, clientY: ay, button: 0 }))
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, view: window, clientX: bx, clientY: by }))
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window, clientX: bx, clientY: by }))
    },
    { fracAx, fracAy, fracBx, fracBy },
  )
}

test.describe('Overlay Compare: measure ruler', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('misc', 'overlay-compare-measure')
  })

  test('arming lays a capture pane and a drag pins a ruler + fires measured', async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.__measured = null
      window.chart.addEventListener('measured', (c, o) => (window.__measured = o))
      window.chart.startMeasure()
    })

    expect(
      await page.evaluate(() => !!window.chart.el.querySelector('.apexcharts-measure-capture')),
    ).toBe(true)

    // drag lower-left -> upper-right: dx > 0 and dy > 0
    await dragMeasure(page, 0.25, 0.75, 0.75, 0.25)

    // a pinned ruler line exists and the live overlay is gone
    const dom = await page.evaluate(() => ({
      pin: !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-line'),
      live: !!window.chart.el.querySelector('.apexcharts-measure-live'),
      measured: window.__measured,
    }))
    expect(dom.pin).toBe(true)
    expect(dom.live).toBe(false)
    expect(dom.measured).toBeTruthy()
    expect(dom.measured.dx).toBeGreaterThan(0)
    expect(dom.measured.dy).toBeGreaterThan(0)
  })

  test('a pinned ruler re-projects across a re-render (data-anchored)', async ({
    page,
  }) => {
    await page.evaluate(() => window.chart.startMeasure())
    await dragMeasure(page, 0.2, 0.7, 0.8, 0.3)

    const x1Before = await page.evaluate(() =>
      parseFloat(window.chart.el.querySelector('.apexcharts-measure-pins line').getAttribute('x1')),
    )

    // change the x domain -> the pin must re-project to new pixel coords
    await page.evaluate(() => window.chart.updateOptions({ xaxis: { min: 0, max: 30 } }))
    await page.waitForFunction(
      () => window.chart.w.globals.maxX === 30,
    )

    const after = await page.evaluate(() => {
      const line = window.chart.el.querySelector('.apexcharts-measure-pins line')
      return { present: !!line, x1: line ? parseFloat(line.getAttribute('x1')) : null }
    })
    expect(after.present).toBe(true)
    expect(after.x1).not.toBe(x1Before)
  })

  test('clearMeasures removes all pinned rulers', async ({ page }) => {
    await page.evaluate(() => window.chart.startMeasure())
    await dragMeasure(page, 0.25, 0.75, 0.75, 0.25)
    expect(
      await page.evaluate(() => !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-line')),
    ).toBe(true)

    await page.evaluate(() => window.chart.clearMeasures())
    expect(
      await page.evaluate(() => !!window.chart.el.querySelector('.apexcharts-measure-pins .apexcharts-measure-line')),
    ).toBe(false)
  })
})
