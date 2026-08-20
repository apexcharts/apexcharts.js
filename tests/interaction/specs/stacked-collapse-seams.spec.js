/**
 * Stacked bar/column, the stack must stay closed for the whole transition.
 *
 * A stacked chart draws its layers edge to edge, so every frame of an update is
 * only correct if the seam between two neighbouring segments stays shut. Three
 * separate defects used to tear it open, all of them invisible in a
 * before/after snapshot because start and end states were always right:
 *
 *   1. Layers were staggered against each other on updates, so a segment moved
 *      before the one beneath it had finished.
 *   2. A series hidden from the legend was blanked on the first frame while its
 *      marks kept their old slot for the length of the exit tween, leaving a
 *      hole the size of the outgoing layer.
 *   3. A layer whose rounded-corner state flipped (it became, or stopped being,
 *      the top/bottom of its stack) could not be morphed and snapped straight
 *      to its final slot while the rest of the stack was still sliding.
 *
 * These tests sample the geometry every animation frame and assert the seams,
 * which is the only way to see any of it.
 */

import { test, expect } from '../fixtures/base.js'

/**
 * Wait until no bar has moved between two polls.
 *
 * `animationEnded` flips as soon as one series' morph reports done, but the
 * mount animation staggers bars against each other, so the later columns of a
 * stacked chart are still rising for a while after that. Starting to sample
 * seams then would measure the build-up cascade, which is meant to look
 * staggered, instead of the transition under test.
 */
async function waitForStillChart(page) {
  await page.waitForFunction(
    () => {
      const sig = [...document.querySelectorAll('.apexcharts-bar-area')]
        .map((p) => p.getAttribute('d'))
        .join('|')
      const still = window.__lastSig === sig
      window.__lastSig = sig
      return still
    },
    null,
    { timeout: 10_000, polling: 250 },
  )
}

/**
 * Watch every frame of the next transition and return the widest gap ever seen
 * between two painted neighbours in any stack.
 *
 * A segment that is transparent (collapsed) or unpainted counts as a hole of
 * its own size, which is exactly the defect we are guarding against: the layer
 * is still occupying the stack but showing the page background.
 */
async function worstSeamGap(page, { horizontal = false, durationMs = 2000 } = {}) {
  await page.evaluate((horizontal) => {
    window.__worstGap = 0
    const tick = () => {
      const groups = [...document.querySelectorAll('.apexcharts-series')]
      const bars = groups[0]
        ? groups[0].querySelectorAll('.apexcharts-bar-area').length
        : 0
      for (let j = 0; j < bars; j++) {
        const segs = groups.map((g) => {
          const p = g.querySelector(`.apexcharts-bar-area[j="${j}"]`)
          if (!p) return null
          const b = p.getBBox()
          return {
            painted:
              window.getComputedStyle(g).opacity !== '0' &&
              p.getAttribute('fill') !== 'none',
            x: b.x,
            y: b.y,
            w: b.width,
            h: b.height,
          }
        })
        for (let i = 0; i < segs.length - 1; i++) {
          const lower = segs[i]
          const upper = segs[i + 1]
          if (!lower || !upper) continue
          // Columns stack upward (lower.y is the seam), bars stack rightward.
          const gap = horizontal
            ? upper.x - (lower.x + lower.w)
            : lower.y - (upper.y + upper.h)
          const bothPainted = lower.painted && upper.painted
          const hole = bothPainted
            ? gap
            : gap +
              (horizontal
                ? lower.painted
                  ? upper.w
                  : lower.w
                : lower.painted
                  ? upper.h
                  : lower.h)
          if (Math.abs(hole) > Math.abs(window.__worstGap)) {
            window.__worstGap = hole
          }
        }
      }
      window.__rafId = requestAnimationFrame(tick)
    }
    tick()
  }, horizontal)

  return async () => {
    await page.waitForTimeout(durationMs)
    const worst = await page.evaluate(() => {
      cancelAnimationFrame(window.__rafId)
      return Math.abs(window.__worstGap)
    })
    return worst
  }
}

// stacked-column draws a 1px-free stack, so any gap is a real tear. The
// horizontal sample sets stroke.width 1 with white dividers, so its seams sit
// one pixel apart by design.
const COLUMN_TOLERANCE = 1.5
const BAR_TOLERANCE = 2.5

test.describe('Stacked column, seams stay closed through a legend toggle', () => {
  // Every layer, because only the outermost ones flip their rounded corners
  // when a neighbour disappears (this sample sets borderRadius 10 +
  // a stacked chart rounds only the outermost segment of each stack).
  for (const [index, name] of [
    [0, 'Phones'],
    [1, 'Tablets'],
    [2, 'Laptops'],
    [3, 'Wearables'],
  ]) {
    test(`hiding ${name} never opens a gap in the stack`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('column', 'stacked-column')
      await waitForStillChart(page)

      const settle = await worstSeamGap(page)
      await page.locator('.apexcharts-legend-series').nth(index).click()
      expect(await settle()).toBeLessThan(COLUMN_TOLERANCE)
    })

    test(`showing ${name} again never opens a gap in the stack`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('column', 'stacked-column')
      await waitForStillChart(page)

      await page.locator('.apexcharts-legend-series').nth(index).click()
      await waitForStillChart(page)

      const settle = await worstSeamGap(page)
      await page.locator('.apexcharts-legend-series').nth(index).click()
      expect(await settle()).toBeLessThan(COLUMN_TOLERANCE)
    })
  }
})

test.describe('Stacked bar (horizontal), seams stay closed through a legend toggle', () => {
  test('hiding a middle series never opens a gap in the stack', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bar', 'stacked-bar')
    await waitForStillChart(page)

    const settle = await worstSeamGap(page, { horizontal: true })
    await page.locator('.apexcharts-legend-series').nth(1).click()
    expect(await settle()).toBeLessThan(BAR_TOLERANCE)
  })

  test('hiding the last series never opens a gap in the stack', async ({
    page,
    loadChart,
  }) => {
    await loadChart('bar', 'stacked-bar')
    await waitForStillChart(page)

    const settle = await worstSeamGap(page, { horizontal: true })
    await page.locator('.apexcharts-legend-series').nth(4).click()
    expect(await settle()).toBeLessThan(BAR_TOLERANCE)
  })
})

test.describe('Stacked column, seams stay closed through a value update', () => {
  test('updateSeries moves every layer on one clock', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    const settle = await worstSeamGap(page)
    await page.evaluate(() =>
      window.chart.updateSeries(
        window.chart.w.config.series.map((s, i) => ({
          name: s.name,
          data: s.data.map((v) => Math.max(3, Math.round(v * (i === 0 ? 0.5 : 1.6)))),
        })),
      ),
    )
    expect(await settle()).toBeLessThan(COLUMN_TOLERANCE)
  })
})
