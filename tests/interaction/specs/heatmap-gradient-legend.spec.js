/**
 * Heatmap gradient legend — hover arrow interaction.
 *
 * The gradient legend listens to `dataPointMouseEnter` / `dataPointMouseLeave`
 * events (fired by Graphics.pathMouseEnter for heatmap rects) and translates
 * the arrow polygon along the strip to the position matching the hovered
 * cell's value. This spec verifies:
 *   - Arrow is hidden by default (opacity 0).
 *   - Hovering a cell moves the arrow into position and makes it visible.
 *   - The arrow tip's coordinate along the strip correlates with the cell
 *     value (low cell → leading-end position; high cell → trailing-end).
 *   - mouseleave hides the arrow again.
 */

import { test, expect } from '../fixtures/base.js'
import { hoverDataPoint } from '../helpers/chart.js'

test.describe('Heatmap gradient legend — hover arrow', () => {
  test('arrow tracks hovered cell value along the strip', async ({ page, loadChart }) => {
    await loadChart('heatmap', 'gradient-legend')

    // The sample places the legend on the right (vertical strip). Force a
    // horizontal placement so we can assert the arrow tip moves along X.
    // (The vertical case is covered by the sibling test below.)
    await page.evaluate(() => {
      window.chart.updateOptions({ legend: { position: 'bottom' } })
    })
    await page.waitForFunction(
      () => !!document.querySelector('polygon.apexcharts-heatmap-gradient-arrow'),
    )

    // Sanity — gradient legend SVG and arrow are present, arrow hidden.
    const arrow = page.locator('polygon.apexcharts-heatmap-gradient-arrow')
    await expect(arrow).toHaveCount(1)
    await expect(arrow).toHaveAttribute('opacity', '0')

    // Find a cell with the lowest value and one with the highest value in
    // the rendered data — the demo uses a 7×18 random matrix in 0..90.
    const cellInfo = await page.evaluate(() => {
      const cells = Array.from(
        document.querySelectorAll('.apexcharts-heatmap-rect'),
      )
      let lowest = cells[0]
      let highest = cells[0]
      for (const c of cells) {
        const v = Number(c.getAttribute('val'))
        if (v < Number(lowest.getAttribute('val'))) lowest = c
        if (v > Number(highest.getAttribute('val'))) highest = c
      }
      return {
        lowest: {
          i: Number(lowest.getAttribute('i')),
          j: Number(lowest.getAttribute('j')),
          v: Number(lowest.getAttribute('val')),
        },
        highest: {
          i: Number(highest.getAttribute('i')),
          j: Number(highest.getAttribute('j')),
          v: Number(highest.getAttribute('val')),
        },
      }
    })

    // Hover the lowest cell.
    await hoverDataPoint(page, cellInfo.lowest.i, cellInfo.lowest.j)
    await expect(arrow).toHaveAttribute('opacity', '1')

    // Capture the arrow tip x-coordinate. Polygon points are
    // "tipX,tipY baseX,baseY1 baseX,baseY2" — the tip is the first point.
    const lowTipX = await arrow.evaluate((el) => {
      const pts = el.getAttribute('points') || ''
      const first = pts.split(/\s+/)[0] || ''
      return parseFloat(first.split(',')[0])
    })

    // Now hover the highest cell.
    await hoverDataPoint(page, cellInfo.highest.i, cellInfo.highest.j)
    await expect(arrow).toHaveAttribute('opacity', '1')

    const highTipX = await arrow.evaluate((el) => {
      const pts = el.getAttribute('points') || ''
      const first = pts.split(/\s+/)[0] || ''
      return parseFloat(first.split(',')[0])
    })

    // Default position is 'bottom' → horizontal strip → arrow tip x moves
    // rightward as value increases.
    expect(highTipX).toBeGreaterThan(lowTipX)

    // Move the real mouse off the chart so the cell fires a genuine mouseout
    // (heatmap hover uses mouseover/mouseout delegation, so a synthetic
    // non-bubbling 'mouseleave' wouldn't reach the handler). The arrow hides.
    await page.mouse.move(1, 1)
    await expect(arrow).toHaveAttribute('opacity', '0')
  })

  test('arrow re-aims when legend position switches to a vertical placement', async ({ page, loadChart }) => {
    await loadChart('heatmap', 'gradient-legend')

    // Switch to left position → vertical strip. Arrow tip should now move
    // along the Y axis as value changes.
    await page.evaluate(() => {
      window.chart.updateOptions({ legend: { position: 'left' } })
    })
    await page.waitForFunction(
      () => !!document.querySelector('polygon.apexcharts-heatmap-gradient-arrow'),
    )

    // Pick two cells with clearly different values.
    const cells = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('.apexcharts-heatmap-rect'))
      const lo = all.reduce((a, b) =>
        Number(a.getAttribute('val')) < Number(b.getAttribute('val')) ? a : b,
      )
      const hi = all.reduce((a, b) =>
        Number(a.getAttribute('val')) > Number(b.getAttribute('val')) ? a : b,
      )
      return [
        { i: Number(lo.getAttribute('i')), j: Number(lo.getAttribute('j')) },
        { i: Number(hi.getAttribute('i')), j: Number(hi.getAttribute('j')) },
      ]
    })

    const arrow = page.locator('polygon.apexcharts-heatmap-gradient-arrow')

    await hoverDataPoint(page, cells[0].i, cells[0].j)
    const lowTipY = await arrow.evaluate((el) =>
      parseFloat((el.getAttribute('points') || '').split(/\s+/)[0].split(',')[1]),
    )

    await hoverDataPoint(page, cells[1].i, cells[1].j)
    const highTipY = await arrow.evaluate((el) =>
      parseFloat((el.getAttribute('points') || '').split(/\s+/)[0].split(',')[1]),
    )

    // Vertical strip with min at the bottom → higher value sits higher on
    // the strip (smaller Y in SVG coords).
    expect(highTipY).toBeLessThan(lowTipY)
  })
})
