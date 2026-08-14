/**
 * treemap <-> sunburst, both ways.
 *
 * Neither direction has an exit layer: every mark in both charts is 1:1 with a
 * row, so the outgoing mark IS the incoming mark's first frame. The property
 * that makes it a morph rather than a redraw is therefore simply this: when the
 * new chart draws frame one, each of its marks is sitting exactly where one of
 * the old chart's marks was.
 *
 * It is asserted in BOTH directions on purpose. treemap -> sunburst passed for
 * a long time while sunburst -> treemap grew from nothing, because the sunburst
 * falls back to draw order when a branch key finds no match and the treemap did
 * not: a flat treemap keys its tiles at depth one while a nested sunburst keys
 * its arcs by the whole branch, so every lookup missed and every tile started
 * at zero size.
 *
 * The card under test is the gallery's fifth chart; everything is scoped to it.
 */

import { test } from '../fixtures/base.js'
import { expect } from '@playwright/test'

const CARD = '#chart5'
const TREEMAP_BTN = '#card-partition [data-part="treemap"]'
const SUNBURST_BTN = '#card-partition [data-part="sunburst"]'

/** loadChart only waits for the first chart on the page; this card is the fifth. */
async function settle(page) {
  await page.waitForFunction(
    () => window.chart4 && window.chart4.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
  await page.waitForTimeout(600)
}

/**
 * Every incoming mark's first frame must coincide with an outgoing mark, one
 * for one. Compared as sorted box lists rather than by index, so the pairing
 * rule itself is free to change.
 */
function landsOnSource(before, after) {
  const key = (b) => [b.x, b.y, b.w, b.h]
  const sort = (list) =>
    list
      .slice()
      .sort((p, q) => p.x - q.x || p.y - q.y || p.w - q.w || p.h - q.h)
  const a = sort(before)
  const b = sort(after)
  if (a.length !== b.length) return { ok: false, drift: Infinity }
  let drift = 0
  a.forEach((box, i) => {
    key(box).forEach((v, k) => {
      drift = Math.max(drift, Math.abs(v - key(b[i])[k]))
    })
  })
  return { ok: true, drift }
}

test.describe('Partition morph', () => {
  test('treemap -> sunburst: every leaf arc starts as the tile it replaces', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    await settle(page)

    const r = await page.evaluate(async ([card, sunburstBtn]) => {
      const scope = document.querySelector(card)
      const boxes = (sel) =>
        [...scope.querySelectorAll(sel)].map((el) => {
          const b = el.getBoundingClientRect()
          return { x: b.x, y: b.y, w: b.width, h: b.height }
        })

      const tiles = boxes('.apexcharts-treemap-rect')
      document.querySelector(sunburstBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      // Leaves only: the parent rings have no tile to come from and sweep in
      // behind, which is the documented behaviour of the flat pair.
      const leaves = [...scope.querySelectorAll('.apexcharts-sunburst-arc')]
        .filter((a) => a.getAttribute('data:leaf') === 'true')
        .map((el) => {
          const b = el.getBoundingClientRect()
          return { x: b.x, y: b.y, w: b.width, h: b.height }
        })

      await new Promise((res) => setTimeout(res, 1600))
      return {
        tiles,
        leaves,
        settledArcs: scope.querySelectorAll('.apexcharts-sunburst-arc').length,
      }
    }, [CARD, SUNBURST_BTN])

    expect(r.tiles.length).toBeGreaterThan(0)
    expect(r.leaves.length).toBe(r.tiles.length)
    const m = landsOnSource(r.tiles, r.leaves)
    expect(m.ok).toBe(true)
    expect(m.drift).toBeLessThan(1)
    // The rings the treemap could not show arrive too.
    expect(r.settledArcs).toBeGreaterThan(r.tiles.length)
  })

  test('sunburst -> treemap: every tile starts as the arc it replaces', async ({
    page,
    loadChart,
  }) => {
    await loadChart('misc', 'chart-type-morph')
    await settle(page)
    await page.click(SUNBURST_BTN)
    await page.waitForTimeout(1800)

    const r = await page.evaluate(async ([card, treemapBtn]) => {
      const scope = document.querySelector(card)
      const boxOf = (el) => {
        const b = el.getBoundingClientRect()
        return { x: b.x, y: b.y, w: b.width, h: b.height }
      }

      const leaves = [...scope.querySelectorAll('.apexcharts-sunburst-arc')]
        .filter((a) => a.getAttribute('data:leaf') === 'true')
        .map(boxOf)

      document.querySelector(treemapBtn).click()
      await new Promise((res) => requestAnimationFrame(res))

      const first = [...scope.querySelectorAll('.apexcharts-treemap-rect')].map(boxOf)
      // A <rect> cannot hold an arc, so a morphing tile is drawn as a <path>.
      // Mechanism rather than property, but it is the thing that regressed.
      const asPaths = scope.querySelectorAll('path.apexcharts-treemap-rect').length
      const asRects = scope.querySelectorAll('rect.apexcharts-treemap-rect').length

      await new Promise((res) => setTimeout(res, 1600))
      return {
        leaves,
        first,
        asPaths,
        asRects,
        settled: [...scope.querySelectorAll('.apexcharts-treemap-rect')].map(boxOf),
      }
    }, [CARD, TREEMAP_BTN])

    expect(r.leaves.length).toBeGreaterThan(0)
    expect(r.first.length).toBe(r.leaves.length)
    // Frame one is the sunburst, tile for arc.
    const m = landsOnSource(r.leaves, r.first)
    expect(m.ok).toBe(true)
    expect(m.drift).toBeLessThan(1)
    // Not one of them grew from a collapsed rect, which is what the bug did.
    expect(r.first.every((b) => b.w > 0 && b.h > 0)).toBe(true)
    expect(r.asPaths).toBe(r.first.length)
    expect(r.asRects).toBe(0)
    // And they do arrive: the settled tiles are somewhere else entirely.
    expect(landsOnSource(r.leaves, r.settled).drift).toBeGreaterThan(1)
  })
})
