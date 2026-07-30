/**
 * Legend — click to toggle series visibility.
 *
 * Covers:
 *   - Clicking a legend entry collapses the series (adds collapsed class)
 *   - Clicking again re-expands it
 *   - No JS errors during toggle
 */

import { test, expect } from '../fixtures/base.js'
import { clickLegend, collapsedSeriesCount } from '../helpers/chart.js'

// We use mixed/line-column.html which has multiple named series and a legend,
// making it the most straightforward sample for toggle testing.
// Series names: "Website Blog" and "Social Media"

test.describe('Legend toggle', () => {
  test('clicking legend entry collapses a series', async ({ page, loadChart }) => {
    await loadChart('mixed', 'line-column')

    expect(await collapsedSeriesCount(page)).toBe(0)

    // Toggle the first named series off.
    await clickLegend(page, 'Website Blog')

    // Wait for the DOM class to apply.
    await page.waitForTimeout(300)

    expect(await collapsedSeriesCount(page)).toBe(1)
  })

  test('clicking legend entry again re-expands the series', async ({ page, loadChart }) => {
    await loadChart('mixed', 'line-column')

    await clickLegend(page, 'Website Blog')
    await page.waitForTimeout(300)
    expect(await collapsedSeriesCount(page)).toBe(1)

    await clickLegend(page, 'Website Blog')
    await page.waitForTimeout(300)
    expect(await collapsedSeriesCount(page)).toBe(0)
  })

  test('no JS errors during legend toggle', async ({ page, loadChart }) => {
    await loadChart('mixed', 'line-column')

    await clickLegend(page, 'Website Blog')
    await page.waitForTimeout(300)
    await clickLegend(page, 'Social Media')
    await page.waitForTimeout(300)
    // consoleErrors check runs automatically in fixture.
  })
})

// Pie/donut legend click now toggles the SLICE in and out of the chart (same
// as hiding a series on axis charts), instead of merely highlighting it. The
// donut total is a strong behavioral probe: hiding a slice drops it, showing it
// restores it.
test.describe('Pie/donut legend toggle', () => {
  test('clicking a donut legend entry removes the slice, and re-adds it on a second click', async ({
    page,
    loadChart,
  }) => {
    await loadChart('pie', 'rounded-donut')

    // 2nd legend item = "Gabriel Barton" (value 25); total starts at 100.
    const legendItem = page.locator('.apexcharts-legend-series').nth(1)
    const total = page.locator('.apexcharts-datalabel-value')

    await expect(total).toHaveText('100')
    expect(await legendItem.getAttribute('data:collapsed')).toBe('false')

    // Remove the slice.
    await legendItem.click({ force: true })
    await page.waitForTimeout(400)
    expect(await legendItem.getAttribute('data:collapsed')).toBe('true')
    await expect(legendItem).toHaveClass(/apexcharts-inactive-legend/)
    await expect(total).toHaveText('75') // 100 - 25

    // Re-add the slice.
    await legendItem.click({ force: true })
    await page.waitForTimeout(400)
    expect(await legendItem.getAttribute('data:collapsed')).toBe('false')
    await expect(total).toHaveText('100')
  })

  // Object-form data (`series: [{ data: [{x, y, drilldown}, ...] }]`, which
  // pie/donut drilldown requires) packs every slice into ONE series. Regression
  // guard: toggling such a slice must hide just that slice, not blank the whole
  // chart (a slice index was being treated as a series index), and clicking an
  // index > 0 must not throw.
  test('object-form (drilldown) donut: toggling a slice hides only that slice, not the chart', async ({
    page,
    loadChart,
  }) => {
    await loadChart('pie', 'donut-with-drilldown')

    const legendItems = page.locator('.apexcharts-legend-series')
    await expect(legendItems).toHaveCount(3) // Mobile, Desktop, Tablet
    const breadcrumb = page.locator('.apexcharts-breadcrumb')

    // Toggle the 2nd item (Desktop, index 1) — index > 0 previously threw.
    const desktop = legendItems.nth(1)
    await desktop.click({ force: true })
    await page.waitForTimeout(400)

    // Chart still intact: all three legend items still present, only Desktop
    // collapsed, and we have NOT drilled down (no breadcrumb).
    await expect(legendItems).toHaveCount(3)
    expect(await desktop.getAttribute('data:collapsed')).toBe('true')
    expect(await legendItems.nth(0).getAttribute('data:collapsed')).toBe('false')
    expect(await legendItems.nth(2).getAttribute('data:collapsed')).toBe('false')
    await expect(breadcrumb).toHaveCount(0)

    // Re-add.
    await desktop.click({ force: true })
    await page.waitForTimeout(400)
    expect(await desktop.getAttribute('data:collapsed')).toBe('false')
    // consoleErrors check runs automatically in fixture.
  })
})
