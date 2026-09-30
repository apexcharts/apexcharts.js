/**
 * Column crosshair band alignment — with and without a bar stroke.
 *
 * Regression for the report that the hover band sits ~3 px left of a column
 * drawn with `stroke: { width: 2 }`, with the bar's right edge outside the
 * band, and is still up to 1 px off with no stroke at all.
 *
 * Root cause: `Intersect.handleBarTooltip` fed `moveXCrosshairs` a centre
 * derived from the bar's `cx` attribute and its rendered (geometry) width.
 * `getColumnPaths` insets the path by half the stroke on each side, so a
 * stroked bar reports a `cx` that is strokeWidth/2 smaller and a width that is
 * a whole strokeWidth smaller — together shifting the band a full stroke width
 * left. `parseInt` on the fractional `cx` added the residual sub-pixel error.
 *
 * Fix: pass the bar's rect-derived centre (`barAnchorXInGrid`), which is
 * stroke independent because a stroke grows the bar symmetrically.
 */

import { test, expect } from '../fixtures/base.js'

/**
 * Hover series 0 / point `j` and return the painted bar span and the crosshair
 * band span, both in grid-local SVG user units.
 */
async function measure(page, j) {
  const sel = `.apexcharts-series[rel="1"] .apexcharts-bar-area[j="${j}"]`
  await page.locator(sel).first().hover({ force: true })
  // The band has a CSS transition; let it settle before measuring.
  await page.waitForTimeout(400)

  return page.evaluate((sel) => {
    const bar = document.querySelector(sel)
    const band = document.querySelector('.apexcharts-xcrosshairs')
    const bbox = bar.getBBox()
    const w = window.chart.w
    const sw = Array.isArray(w.config.stroke.width)
      ? w.config.stroke.width[0]
      : w.config.stroke.width
    const bandX = parseFloat(band.getAttribute('x'))
    const bandW = parseFloat(band.getAttribute('width'))
    return {
      // getBBox is the geometry box; the painted bar extends half the stroke
      // beyond it on each side.
      barLeft: bbox.x - sw / 2,
      barRight: bbox.x + bbox.width + sw / 2,
      bandLeft: bandX,
      bandRight: bandX + bandW,
      bandActive: band.classList.contains('apexcharts-active'),
    }
  }, sel)
}

test.describe('Column crosshair band vs the painted bar', () => {
  for (const strokeWidth of [0, 2, 6]) {
    test(`band covers the bar exactly with stroke width ${strokeWidth}`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('column', 'basic-column')

      await page.evaluate((sw) => {
        return window.chart.updateOptions({
          chart: { animations: { enabled: false } },
          stroke: { show: sw > 0, width: sw },
          tooltip: { shared: false, intersect: true },
          xaxis: { crosshairs: { width: 'barWidth' } },
        })
      }, strokeWidth)
      await page.waitForFunction(
        () => window.chart.w.globals.animationEnded === true,
        { timeout: 5_000 },
      )

      for (const j of [0, 2, 5]) {
        const m = await measure(page, j)
        expect(m.bandActive, `band active for point ${j}`).toBe(true)
        // Sub-pixel tolerance only — the band used to be a full strokeWidth off.
        expect(m.bandLeft, `left edge for point ${j}`).toBeCloseTo(m.barLeft, 1)
        expect(m.bandRight, `right edge for point ${j}`).toBeCloseTo(
          m.barRight,
          1,
        )
      }
    })
  }
})
