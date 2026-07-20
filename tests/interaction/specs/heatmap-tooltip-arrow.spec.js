/**
 * Heatmap tooltip — anchored above the cell with a downward arrow.
 *
 * By default a heatmap tooltip now behaves like a horizontal-bar tooltip: it
 * sits centered ABOVE the hovered cell with a downward arrow pointing at it
 * (flipping BELOW when the cell is against the top edge), instead of trailing
 * the cursor. This spec verifies:
 *   - the tooltip carries a top/bottom `data-placement`,
 *   - a `.apexcharts-tooltip-arrow` element is present and centered on the cell,
 *   - the tooltip body sits on the correct side of the cell,
 *   - `tooltip.followCursor: true` restores the legacy cursor-trailing tooltip
 *     (no placement, no arrow).
 */

import { test, expect } from '../fixtures/base.js'
import { hoverDataPoint, waitForTooltip } from '../helpers/chart.js'

// Resolve a cell near the vertical middle of the grid (so there is room both
// above and below it) and return its i/j plus geometry.
async function middleCell(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('.apexcharts-grid').getBoundingClientRect()
    const midY = grid.top + grid.height / 2
    const cells = Array.from(document.querySelectorAll('.apexcharts-heatmap-rect'))
    let best = null
    let bestDist = Infinity
    for (const c of cells) {
      const r = c.getBoundingClientRect()
      const cy = (r.top + r.bottom) / 2
      const cx = (r.left + r.right) / 2
      // keep away from the horizontal edges so the arrow isn't clamped
      if (cx < grid.left + grid.width * 0.25) continue
      if (cx > grid.left + grid.width * 0.75) continue
      const d = Math.abs(cy - midY)
      if (d < bestDist) {
        bestDist = d
        best = { i: Number(c.getAttribute('index')), j: Number(c.getAttribute('j')) }
      }
    }
    return best
  })
}

async function readTooltip(page, i, j) {
  return page.evaluate(
    ([si, di]) => {
      const tt = document.querySelector('.apexcharts-tooltip')
      const arrow = tt.querySelector('.apexcharts-tooltip-arrow')
      const cell = document.querySelector(`[index="${si}"][j="${di}"]`)
      const tr = tt.getBoundingClientRect()
      const cr = cell.getBoundingClientRect()
      const ar = arrow ? arrow.getBoundingClientRect() : null
      return {
        placement: tt.getAttribute('data-placement'),
        hasArrow: !!arrow,
        ttTop: tr.top,
        ttBottom: tr.bottom,
        cellTop: cr.top,
        cellBottom: cr.bottom,
        cellCx: (cr.left + cr.right) / 2,
        arrowCx: ar ? (ar.left + ar.right) / 2 : null,
      }
    },
    [i, j],
  )
}

test.describe('Heatmap tooltip — above the cell with an arrow', () => {
  test('anchors above the hovered cell with a centered downward arrow', async ({
    page,
    loadChart,
  }) => {
    await loadChart('heatmap', 'basic')

    const cell = await middleCell(page)
    expect(cell).not.toBeNull()

    await hoverDataPoint(page, cell.i, cell.j)
    await waitForTooltip(page)

    const t = await readTooltip(page, cell.i, cell.j)

    // Placement is one of the vertical variants, and the arrow exists.
    expect(['top', 'bottom']).toContain(t.placement)
    expect(t.hasArrow).toBe(true)

    // Tooltip body sits on the correct side of the cell (small tolerance for
    // the arrow overhang + sub-pixel rounding).
    if (t.placement === 'top') {
      expect(t.ttBottom).toBeLessThanOrEqual(t.cellTop + 3)
    } else {
      expect(t.ttTop).toBeGreaterThanOrEqual(t.cellBottom - 3)
    }

    // Arrow points at the cell's horizontal center.
    expect(Math.abs(t.arrowCx - t.cellCx)).toBeLessThan(14)
  })

  test('tooltip.followCursor:true restores the legacy tooltip (no arrow)', async ({
    page,
    loadChart,
  }) => {
    await loadChart('heatmap', 'basic')

    await page.evaluate(() =>
      window.chart.updateOptions({ tooltip: { followCursor: true } }),
    )
    await page.waitForFunction(
      () => window.chart && window.chart.w.globals.animationEnded === true,
    )

    const cell = await middleCell(page)
    await hoverDataPoint(page, cell.i, cell.j)
    await waitForTooltip(page)

    const placement = await page.evaluate(() =>
      document
        .querySelector('.apexcharts-tooltip')
        .getAttribute('data-placement'),
    )
    // Legacy cursor-trailing path never sets a vertical placement.
    expect(placement).toBeNull()
  })
})
