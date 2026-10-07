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

import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { test, expect } from '../fixtures/base.js'
import { hoverDataPoint, waitForTooltip } from '../helpers/chart.js'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

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

// The tooltip box, its placement, and where its arrow tip is: the corner of
// the rotated arrow square that points away from the box.
async function readArrowTip(page) {
  return page.evaluate(() => {
    const tt = document.querySelector('.apexcharts-tooltip')
    const arrow = tt.querySelector('.apexcharts-tooltip-arrow')
    const b = tt.getBoundingClientRect()
    const a = arrow.getBoundingClientRect()
    const placement = tt.dataset.placement ?? null
    const mx = (a.left + a.right) / 2
    const my = (a.top + a.bottom) / 2
    const half = a.width / 2
    const tip = {
      top: { x: mx, y: my + half },
      bottom: { x: mx, y: my - half },
      right: { x: mx - half, y: my },
      left: { x: mx + half, y: my },
    }[placement]
    return {
      placement,
      tip,
      box: { left: b.left, top: b.top, right: b.right, bottom: b.bottom },
    }
  })
}

const cellRect = (page, sel) =>
  page.locator(sel).first().evaluate((el) => {
    const r = el.getBoundingClientRect()
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
  })

/** Distance from point `p` to rect `r` (0 inside or on it). */
function distance(p, r) {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right)
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom)
  return Math.hypot(dx, dy)
}

/** How far the two rects overlap along the narrower axis (0 if they don't). */
function overlap(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return Math.max(0, Math.min(w, h))
}

function expectArrowOnCell(t, cell, label) {
  expect(t.tip, `${label}: an arrow with a placement`).toBeTruthy()
  expect(distance(t.tip, cell), `${label}: arrow tip on the cell`).toBeLessThan(
    1.5,
  )
  expect(overlap(t.box, cell), `${label}: box clear of the cell`).toBeLessThan(
    1.5,
  )
}

test.describe('Heatmap tooltip: the arrow lands on the hovered cell', () => {
  // continuous-datetime is a 220px heatmap whose tooltip is a little over half
  // the plot's height: in the two middle rows it fits neither above nor below
  // the cell. It used to be pinned to the plot's top there, covering the cell,
  // with the arrow on a row above it. The first and last cells straddle the
  // plot's sides, where the arrow could not reach them.
  test('in every row, at the first, a middle and the last column', async ({
    page,
    loadChart,
  }) => {
    await loadChart('heatmap', 'continuous-datetime')

    const cells = await page.evaluate(() => {
      const byRow = new Map()
      for (const c of document.querySelectorAll('.apexcharts-heatmap-rect')) {
        const i = c.getAttribute('i')
        if (!byRow.has(i)) byRow.set(i, [])
        byRow.get(i).push(Number(c.getAttribute('j')))
      }
      const out = []
      for (const [i, js] of byRow) {
        js.sort((a, b) => a - b)
        for (const j of [js[0], js[Math.floor(js.length / 2)], js.at(-1)]) {
          out.push({ i, j })
        }
      }
      return out
    })
    expect(cells.length).toBeGreaterThanOrEqual(18)

    const placements = new Set()
    for (const { i, j } of cells) {
      const sel = `.apexcharts-heatmap-rect[i='${i}'][j='${j}']`
      const cell = await cellRect(page, sel)
      const x = (cell.left + cell.right) / 2
      const y = (cell.top + cell.bottom) / 2
      // Two moves: the box settles on the second.
      await page.mouse.move(x, y)
      await page.mouse.move(x + 0.5, y)
      await waitForTooltip(page)
      await page.waitForTimeout(250)
      const t = await readArrowTip(page)
      placements.add(t.placement)
      expectArrowOnCell(t, cell, `row ${i}, column ${j} (${t.placement})`)
    }
    // the demo exercises the beside-the-cell case, and above and below too
    expect([...placements].sort()).toEqual(['bottom', 'left', 'right', 'top'])
  })

  test('keyboard focus puts the box where the pointer does', async ({
    page,
    loadChart,
  }) => {
    await loadChart('heatmap', 'continuous-datetime')
    await page.evaluate(() => document.querySelector('.apexcharts-svg').focus())

    // Into the chart and a few columns in, then row by row up from the bottom
    // row (series 0) to the first of the two middle rows (series 2 and 3, of
    // six), where the box fits neither above nor below the cell.
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight']) {
      await page.keyboard.press(key)
    }
    const focused = () =>
      page.evaluate(() => {
        const el = document.querySelector('.apexcharts-keyboard-focused')
        return {
          i: Number(el?.getAttribute('i')),
          top: el?.getBoundingClientRect().top,
        }
      })
    let at = await focused()
    for (let n = 0; n < 6 && ![2, 3].includes(at.i); n++) {
      await page.keyboard.press('ArrowUp')
      const next = await focused()
      expect(next.top, 'ArrowUp moves up the screen').toBeLessThan(at.top)
      at = next
    }
    expect([2, 3], 'reached a middle row').toContain(at.i)
    await page.keyboard.press('ArrowDown')
    expect((await focused()).top, 'ArrowDown moves down').toBeGreaterThan(
      at.top,
    )
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(300)

    const cell = await cellRect(page, '.apexcharts-keyboard-focused')
    const t = await readArrowTip(page)
    expect(['left', 'right'], 'a middle row: beside the cell').toContain(
      t.placement,
    )
    expectArrowOnCell(t, cell, `keyboard (${t.placement})`)
  })

  // A heatmap painted to canvas has no node per cell, and keyboard focus used
  // to look for one: the box opened wherever it last was (the chart's corner
  // on the first key) and no cell showed the focus outline.
  test('keyboard focus on a canvas heatmap puts the box where the pointer does', async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(
      `file://${resolve(rootDir, 'samples/vanilla-js/heatmap/heatmap-canvas-renderer.html')}`,
    )
    // A canvas heatmap paints its cells rather than animating them in, so it
    // never raises animationEnded; wait for the renderer instead.
    await page.waitForFunction(
      () => window.chart?.w.globals.activeRenderer?.kind === 'canvas',
    )
    expect(
      await page.locator('.apexcharts-heatmap-rect').count(),
      'cells are painted, not nodes',
    ).toBe(0)
    await page.evaluate(() => document.querySelector('.apexcharts-svg').focus())

    const ring = page.locator(
      '.apexcharts-keyboard-focus-ring.apexcharts-keyboard-focused',
    )
    const box = (t) => ({ ...t.box, placement: t.placement })

    // A middle row, then the top row, where the box flips below the cell.
    const placements = []
    for (const keys of [
      ['ArrowRight', 'ArrowRight', 'ArrowRight', ...Array(25).fill('ArrowUp')],
      Array(30).fill('ArrowUp'),
    ]) {
      await page.mouse.move(0, 0)
      for (const key of keys) await page.keyboard.press(key)
      await page.waitForTimeout(250)

      await expect(ring, 'one outline, on the focused cell').toHaveCount(1)
      const focused = await page.evaluate(() => ({
        i: window.chart.w.interact.capturedSeriesIndex,
        j: window.chart.w.interact.capturedDataPointIndex,
      }))
      expect(await ring.getAttribute('i')).toBe(String(focused.i))
      expect(await ring.getAttribute('j')).toBe(String(focused.j))
      expect(await ring.getAttribute('aria-label')).toBeTruthy()

      const cell = await cellRect(page, '.apexcharts-keyboard-focus-ring')
      const byKey = await readArrowTip(page)
      expectArrowOnCell(byKey, cell, `keyboard (${byKey.placement})`)
      placements.push(byKey.placement)

      // The pointer on the same cell puts the box in the same place.
      const x = (cell.left + cell.right) / 2
      const y = (cell.top + cell.bottom) / 2
      await page.mouse.move(x, y)
      await page.mouse.move(x + 0.5, y)
      await page.waitForTimeout(250)
      expect(
        await page.evaluate(() => [
          window.chart.w.interact.capturedSeriesIndex,
          window.chart.w.interact.capturedDataPointIndex,
        ]),
      ).toEqual([focused.i, focused.j])
      const byPointer = await readArrowTip(page)
      expect(byPointer.placement).toBe(byKey.placement)
      for (const side of ['left', 'top', 'right', 'bottom']) {
        expect(
          Math.abs(byPointer.box[side] - byKey.box[side]),
          `${side}: ${JSON.stringify([box(byKey), box(byPointer)])}`,
        ).toBeLessThan(1)
      }
    }
    expect(placements).toEqual(['top', 'bottom'])

    // The outline goes with the focus.
    await page.mouse.move(0, 0)
    await page.keyboard.press('Escape')
    await expect(ring).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('a box wider than a phone-width trellis panel stays on screen', async ({
    page,
  }) => {
    // Six synced 30px-wide heatmap panels, each showing a box about 120px
    // wide on every hover. Held to a panel's plot sideways, the boxes of the
    // right-hand panels ran off the viewport and widened the page.
    await page.setViewportSize({ width: 390, height: 844 })
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(
      `file://${resolve(rootDir, 'samples/vanilla-js/trellis/activity-by-location.html')}`,
    )
    await page.waitForFunction(
      () => document.querySelectorAll('.apexcharts-heatmap-rect').length >= 300,
    )
    await page.waitForTimeout(800)

    const panels = await page.evaluate(() =>
      [...document.querySelectorAll('.apexcharts-canvas')]
        .filter((c) => c.querySelector('.apexcharts-heatmap-rect'))
        .map((c) => c.id),
    )
    expect(panels.length).toBe(6)

    for (const id of panels) {
      for (const j of [0, 4, 7]) {
        const sel = `#${id} .apexcharts-heatmap-rect[i='3'][j='${j}']`
        const cell = await cellRect(page, sel)
        const x = (cell.left + cell.right) / 2
        const y = (cell.top + cell.bottom) / 2
        await page.mouse.move(x, y)
        await page.mouse.move(x + 0.5, y)
        await page.waitForTimeout(250)
        const r = await page.evaluate(() => {
          const boxes = [
            ...document.querySelectorAll('.apexcharts-tooltip.apexcharts-active'),
          ].map((tt) => tt.getBoundingClientRect())
          return {
            count: boxes.length,
            left: Math.min(...boxes.map((b) => b.left)),
            right: Math.max(...boxes.map((b) => b.right)),
            pageWidth: document.documentElement.scrollWidth,
          }
        })
        const info = `${id} column ${j}: ${JSON.stringify(r)}`
        expect(r.count, info).toBeGreaterThan(0)
        expect(r.left, info).toBeGreaterThanOrEqual(-0.5)
        expect(r.right, info).toBeLessThanOrEqual(390.5)
        expect(r.pageWidth, info).toBeLessThanOrEqual(390)
      }
    }
    expect(errors).toEqual([])
  })
})

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
