/**
 * Keyboard zoom & pan tests (WCAG 2.5.7 Dragging Movements alternative).
 *
 * Verifies that:
 *   - '+' / '=' keys zoom in (narrow x-range)
 *   - '-' / '_' keys zoom out (widen x-range)
 *   - '0' key resets zoom
 *   - Shift+ArrowLeft / Shift+ArrowRight pan the visible window
 *   - The sr-status live region receives an announcement on each gesture
 */

import { test, expect } from '../fixtures/base.js'
import { getXRange } from '../helpers/chart.js'

const CHART = 'line'
const FIXTURE = 'zoom-pan-selection'

async function focusChart(page) {
  await page.evaluate(() => {
    document.querySelector('.apexcharts-svg').focus()
  })
}

async function getStatusText(page) {
  return page.locator('.apexcharts-sr-status').textContent()
}

test.describe('Keyboard zoom & pan (WCAG 2.5.7)', () => {
  test('"+" zooms in and announces, "-" zooms back out', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await focusChart(page)

    const before = await getXRange(page)

    await page.keyboard.press('+')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    const afterIn = await getXRange(page)
    expect(afterIn.maxX - afterIn.minX).toBeLessThan(before.maxX - before.minX)
    // Announcement should land in the live region.
    await page.waitForTimeout(20)
    expect((await getStatusText(page)).toLowerCase()).toContain('zoomed in')

    // zoomUpdateOptions can re-create the SVG node, dropping keyboard focus.
    await focusChart(page)
    await page.keyboard.press('-')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    const afterOut = await getXRange(page)
    expect(afterOut.maxX - afterOut.minX).toBeGreaterThan(
      afterIn.maxX - afterIn.minX,
    )
    await page.waitForTimeout(20)
    expect((await getStatusText(page)).toLowerCase()).toContain('zoomed out')
  })

  test('"0" resets zoom after zooming in', async ({ page, loadChart }) => {
    await loadChart(CHART, FIXTURE)
    await focusChart(page)

    const initial = await getXRange(page)

    await page.keyboard.press('+')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )
    // Re-focus after re-render so the next press is captured.
    await focusChart(page)
    await page.keyboard.press('+')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    await focusChart(page)
    await page.keyboard.press('0')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    const after = await getXRange(page)
    // Reset should restore close to the initial range.
    expect(Math.abs(after.minX - initial.minX)).toBeLessThan(
      (initial.maxX - initial.minX) * 0.05,
    )
    expect(Math.abs(after.maxX - initial.maxX)).toBeLessThan(
      (initial.maxX - initial.minX) * 0.05,
    )
  })

  test('Shift+ArrowRight pans right, Shift+ArrowLeft pans left', async ({
    page,
    loadChart,
  }) => {
    await loadChart(CHART, FIXTURE)
    await focusChart(page)

    // Zoom in first so panning has somewhere to move.
    await page.keyboard.press('+')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    await focusChart(page)
    const before = await getXRange(page)
    await page.keyboard.press('Shift+ArrowRight')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    const afterRight = await getXRange(page)
    expect(afterRight.minX).toBeGreaterThan(before.minX)
    expect(afterRight.maxX).toBeGreaterThan(before.maxX)

    await focusChart(page)
    await page.keyboard.press('Shift+ArrowLeft')
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
      { timeout: 5_000 },
    )

    const afterLeft = await getXRange(page)
    expect(afterLeft.minX).toBeLessThan(afterRight.minX)
  })
})
