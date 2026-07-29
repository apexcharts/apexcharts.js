/**
 * Point-annotation hover tooltips (apexcharts/apexcharts.js#2424).
 *
 * The showcase sample keeps the series tooltip disabled, so each test
 * re-enables it at runtime (updateOptions) to exercise the two-tooltips
 * coexistence behaviors this spec guards:
 *
 * 1. Suppression: while the pointer is over an annotation marker, only the
 *    annotation tooltip shows; the series tooltip is kept hidden (two boxes
 *    anchored to the same spot read as a glitch). Leaving the marker restores
 *    the series tooltip on the next mousemove.
 *
 * 2. getElTooltip isolation: the annotation tooltip element shares the
 *    .apexcharts-tooltip class for styling. After updateSeries() the series
 *    tooltip is re-appended and ends up AFTER the annotation tooltip in DOM
 *    order, so a bare querySelector('.apexcharts-tooltip') would return the
 *    annotation tooltip and hijack the series-tooltip machinery. The
 *    :not(.apexcharts-annotation-tooltip) guard keeps both tooltips working
 *    after fast updates.
 */

import { test, expect } from '../fixtures/base.js'

const SERIES_TT = '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)'
const ANNO_TT = '.apexcharts-annotation-tooltip'

// The sample ships with the series tooltip off; turn it on for these tests.
async function enableSeriesTooltip(page) {
  await page.evaluate(() =>
    window.chart.updateOptions({ tooltip: { enabled: true } }),
  )
  await page.waitForTimeout(300)
}

// Active-state of both tooltips in one round-trip.
async function tooltipStates(page) {
  return page.evaluate(
    ([seriesSel, annoSel]) => {
      const active = (sel) => {
        const el = document.querySelector(sel)
        return el ? el.classList.contains('apexcharts-active') : false
      }
      return { series: active(seriesSel), anno: active(annoSel) }
    },
    [SERIES_TT, ANNO_TT],
  )
}

// Move the real mouse to a plain (non-marker) spot over the plot area.
async function hoverPlainSpot(page, fx = 0.35, fy = 0.6) {
  const grid = await page.locator('.apexcharts-grid').boundingBox()
  await page.mouse.move(grid.x + grid.width * fx, grid.y + grid.height * fy)
  await page.waitForTimeout(150)
}

// Hover an annotation marker, then nudge 1px so a mousemove is processed
// after the marker's mouseenter (the suppression runs on mousemove).
async function hoverAnnotationMarker(page, index) {
  const marker = page.locator('.apexcharts-point-annotation-marker').nth(index)
  await marker.hover()
  const box = await marker.boundingBox()
  await page.mouse.move(box.x + box.width / 2 + 1, box.y + box.height / 2)
  await page.waitForTimeout(150)
}

test.describe('Point-annotation hover tooltips', () => {
  test('marker hover shows only the annotation tooltip; line hover only the series tooltip', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'line-with-annotation-tooltips')
    await enableSeriesTooltip(page)

    // Plain line hover -> series tooltip only (annotation tooltip not even
    // created yet, since it is lazily built on first marker hover).
    await hoverPlainSpot(page)
    expect(await tooltipStates(page)).toEqual({ series: true, anno: false })

    // Annotation marker hover -> annotation tooltip only.
    await hoverAnnotationMarker(page, 1)
    expect(await tooltipStates(page)).toEqual({ series: false, anno: true })

    // The per-annotation dark theme applied (global default is light).
    const isDark = await page.evaluate(
      (sel) =>
        document
          .querySelector(sel)
          .classList.contains('apexcharts-theme-dark'),
      ANNO_TT,
    )
    expect(isDark).toBe(true)

    // Back onto the line -> series tooltip returns, annotation tooltip hides.
    await hoverPlainSpot(page, 0.5, 0.55)
    expect(await tooltipStates(page)).toEqual({ series: true, anno: false })
  })

  test('formatter-built content renders from the annotation data', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'line-with-annotation-tooltips')

    // Third marker ("All-time high") uses tooltip.formatter. No series
    // tooltip needed here; the annotation tooltip works with it disabled.
    await hoverAnnotationMarker(page, 2)

    const html = await page.evaluate(
      (sel) => document.querySelector(sel).innerHTML,
      ANNO_TT,
    )
    expect(html).toContain('New all-time high')
    expect(html).toContain('9,340.85') // built from annotation.y
  })

  test('both tooltips keep working after updateSeries reorders the tooltip DOM', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'line-with-annotation-tooltips')
    await enableSeriesTooltip(page)

    // Create the annotation tooltip element (lazy) so it exists pre-update.
    await hoverAnnotationMarker(page, 0)
    expect((await tooltipStates(page)).anno).toBe(true)

    await page.evaluate(() => {
      const data = window.series.monthDataSeries1.prices.map((p) => p + 50)
      return window.chart.updateSeries([{ name: 'Price', data }])
    })
    await page.waitForTimeout(400)

    // The hazard this test exists for: the re-appended series tooltip now
    // sits after the annotation tooltip in DOM order.
    const order = await page.evaluate(() =>
      [...document.querySelectorAll('.apexcharts-tooltip')].map((el) =>
        el.classList.contains('apexcharts-annotation-tooltip')
          ? 'anno'
          : 'series',
      ),
    )
    expect(order).toEqual(['anno', 'series'])

    // Series tooltip still works, with real content.
    await hoverPlainSpot(page, 0.4, 0.5)
    expect(await tooltipStates(page)).toEqual({ series: true, anno: false })
    const title = await page.evaluate(
      (sel) =>
        document
          .querySelector(`${sel} .apexcharts-tooltip-title`)
          .textContent.trim(),
      SERIES_TT,
    )
    expect(title.length).toBeGreaterThan(0)

    // Annotation tooltip still works too.
    await hoverAnnotationMarker(page, 1)
    expect(await tooltipStates(page)).toEqual({ series: false, anno: true })
  })
})
