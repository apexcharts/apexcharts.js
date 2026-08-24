/**
 * Unit chart pictogram marks: hover, hit area, and swapping the glyph live.
 *
 * The unit tests already prove a glyph renders as one <path> with no recolour
 * filter. What only a real browser can settle is the behaviour that changed
 * when a unit stopped being a circle:
 *
 *   - A filled glyph is hit-tested over its INK, not its bounding box. Hovering
 *     the ink must open the tooltip; hovering a gap inside the glyph's box must
 *     NOT throw, and must leave the last tooltip alone rather than flickering.
 *     That degradation is deliberate and unfixable portably
 *     (`pointer-events: bounding-box` is Chrome only), so it is pinned here.
 *   - Swapping the mark or the layout at runtime goes through updateOptions and
 *     must not leave stale nodes, stale listeners, or a broken tooltip.
 *
 * The sample carries two button rows, one per axis of the design (layout and
 * mark), which is also the thing being asserted: they are independent.
 */

import { test, expect } from '../fixtures/base.js'
import { waitForTooltip } from '../helpers/chart.js'

const GLYPH = 'path.apexcharts-unit-area'

/** Centre of the nth glyph, in page coordinates. */
async function glyphBox(page, n = 0) {
  return page.evaluate(
    ([sel, idx]) => {
      const el = document.querySelectorAll(sel)[idx]
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
    },
    [GLYPH, n],
  )
}

async function tooltipVisible(page) {
  return page.evaluate(() => {
    const t = document.querySelector('.apexcharts-tooltip')
    return !!t && t.classList.contains('apexcharts-active')
  })
}

test.describe('Unit chart: pictogram marks', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart('unit', 'pictogram-crowd')
  })

  test('renders one path per unit and no recolour filter', async ({ page }) => {
    const counts = await page.evaluate(() => ({
      glyphs: document.querySelectorAll('path.apexcharts-unit-area').length,
      circles: document.querySelectorAll('circle.apexcharts-unit-area').length,
      filters: document.querySelectorAll('filter[id^="apexcharts-unit-tint-"]').length,
    }))
    expect(counts.glyphs).toBeGreaterThan(100)
    expect(counts.circles).toBe(0)
    // The perf contract: a filter would cost an offscreen surface per element.
    expect(counts.filters).toBe(0)
  })

  test('hovering a glyph opens the tooltip', async ({ page }) => {
    const box = await glyphBox(page, 0)
    expect(box).not.toBeNull()
    await page.mouse.move(box.x, box.y)
    await waitForTooltip(page)
    expect(await tooltipVisible(page)).toBe(true)
  })

  test('the hit area is the ink, so the tooltip tracks the glyph exactly', async ({
    page,
    consoleErrors,
  }) => {
    // A filled <path> is hit-tested over its ink, not its bounding box. This
    // pins the consequence, measured rather than assumed: a point inside the
    // glyph's BOX but off its ink (the notch between a person's legs) is a
    // miss, so the tooltip closes there and reopens on the next glyph. It is
    // the reason the mark lint keeps glyphs chunky, and the reason a fine
    // glyph would read as flickery while sweeping a crowd.
    const box = await glyphBox(page, 40)
    expect(box).not.toBeNull()

    await page.mouse.move(box.x, box.y)
    await waitForTooltip(page)
    expect(await tooltipVisible(page)).toBe(true)

    // Bottom-left of the bounding box: inside the box, off the ink.
    await page.mouse.move(box.x - box.w / 2 + 1, box.y + box.h / 2 - 1)
    await page.waitForTimeout(200)
    expect(await tooltipVisible(page)).toBe(false)

    // And it recovers: the miss leaves no stuck state behind.
    await page.mouse.move(box.x, box.y)
    await waitForTooltip(page)
    expect(await tooltipVisible(page)).toBe(true)

    expect(consoleErrors).toEqual([])
  })

  test('swapping the mark keeps the layout and swaps every glyph', async ({
    page,
    consoleErrors,
  }) => {
    const before = await page.evaluate(
      (sel) => document.querySelector(sel).getAttribute('d'),
      GLYPH,
    )
    await page.click('#mark-nav button[data-mark="house"]')
    await page.waitForTimeout(1200)

    const after = await page.evaluate((sel) => {
      const els = [...document.querySelectorAll(sel)]
      return { d: els[0].getAttribute('d'), unique: new Set(els.map((e) => e.getAttribute('d'))).size, n: els.length }
    }, GLYPH)

    expect(after.d).not.toBe(before)
    // Every unit swapped, not just the first.
    expect(after.unique).toBe(1)
    expect(after.n).toBeGreaterThan(100)
    expect(consoleErrors).toEqual([])
  })

  test('swapping the layout keeps the mark and moves every glyph', async ({
    page,
    consoleErrors,
  }) => {
    const read = () =>
      page.evaluate((sel) => {
        const els = [...document.querySelectorAll(sel)]
        return {
          d: els[0].getAttribute('d'),
          xs: els.map((e) => e.getAttribute('transform')).join('|'),
          n: els.length,
        }
      }, GLYPH)

    const before = await read()
    await page.click('#layout-nav button[data-layout="house"]')
    await page.waitForTimeout(1600)
    const after = await read()

    // Same glyph, different places.
    expect(after.d).toBe(before.d)
    expect(after.xs).not.toBe(before.xs)
    expect(after.n).toBe(before.n)
    expect(consoleErrors).toEqual([])
  })

  test('the plain-dot fallback swaps element type without leaving strays', async ({
    page,
    consoleErrors,
  }) => {
    await page.click('#mark-nav button[data-mark=""]')
    await page.waitForTimeout(1300)
    const counts = await page.evaluate(() => ({
      glyphs: document.querySelectorAll('path.apexcharts-unit-area').length,
      circles: document.querySelectorAll('circle.apexcharts-unit-area').length,
    }))
    expect(counts.glyphs).toBe(0)
    expect(counts.circles).toBeGreaterThan(100)

    // And a circle still hover-tests, so the swap did not orphan the listener.
    const box = await page.evaluate(() => {
      const r = document.querySelector('circle.apexcharts-unit-area').getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
    await page.mouse.move(box.x, box.y)
    await waitForTooltip(page)
    expect(await tooltipVisible(page)).toBe(true)
    expect(consoleErrors).toEqual([])
  })
})
