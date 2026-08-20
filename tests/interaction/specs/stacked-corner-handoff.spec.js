/**
 * Stacked bar/column, a rounded cap belongs to the OUTER edge of the stack.
 *
 * A stacked bar with a borderRadius only ever carries top-rounded geometry; a
 * bottom radius is produced by mirroring the element with apexcharts-flip-y
 * (or -x, horizontal). So the radius has two independent parts, how big it is
 * (the path) and which end it is on (the mirror), and every transition used to
 * get one or both wrong:
 *
 *   1. The mirror followed the new corner state instantly while the geometry it
 *      belongs to took the whole tween, so a departing layer kept its rounded
 *      corners but lost the mirror and drew them INVERTED, on top.
 *   2. The layer inheriting the outer edge rounded on the way there. Its rounded
 *      edge is an interior seam for as long as the departing layer has any
 *      extent left, so it cut two notches showing the neighbour through them, 
 *      a rounded corner in the middle of a stack.
 *
 * Both directions, hide and re-show. Neither is visible in a before/after
 * snapshot: the settled states were always right. These tests sample every
 * animation frame, which is the only way to see any of it.
 */

import { test, expect } from '../fixtures/base.js'

/** @see stacked-collapse-seams.spec.js, same reason: animationEnded fires early. */
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
 * Record, for every frame of the next transition, each series' first bar: the
 * radius baked into its path, whether it is mirrored, and its box.
 */
async function watchCorners(page) {
  await page.evaluate(() => {
    // For a corner rounded by r, roundPathCorners starts the curve r before the
    // corner and ends it r after, so the |dx| between a C command's own start
    // and end point IS r.
    const radiusOf = (d) => {
      const toks = d.trim().split(/[\s,]+/)
      const pts = []
      let i = 0
      while (i < toks.length) {
        const c = toks[i]
        if (/^[MLC]$/i.test(c)) {
          const n = c.toUpperCase() === 'C' ? 6 : 2
          const nums = toks.slice(i + 1, i + 1 + n).map(Number)
          pts.push({ c: c.toUpperCase(), end: [nums[n - 2], nums[n - 1]] })
          i += 1 + n
        } else i += 1
      }
      for (let k = 1; k < pts.length; k++) {
        if (pts[k].c === 'C') return Math.abs(pts[k].end[0] - pts[k - 1].end[0])
      }
      return 0
    }

    window.__frames = []
    const tick = () => {
      const row = []
      document.querySelectorAll('.apexcharts-series').forEach((g) => {
        const p = g.querySelector('.apexcharts-bar-area')
        if (!p) return
        const b = p.getBBox()
        row.push({
          name: g.getAttribute('seriesName'),
          mirrored:
            p.classList.contains('apexcharts-flip-y') ||
            p.classList.contains('apexcharts-flip-x'),
          radius: radiusOf(p.getAttribute('d') || ''),
          top: b.y,
          height: b.height,
        })
      })
      window.__frames.push(row)
      window.__rafId = requestAnimationFrame(tick)
    }
    window.__rafId = requestAnimationFrame(tick)
  })

  return async function settle() {
    await page.waitForTimeout(2500)
    return page.evaluate(() => {
      cancelAnimationFrame(window.__rafId)
      const R = 0.5 // below this there is no corner to see
      const violations = { inverted: [], interior: [] }
      const frames = window.__frames

      for (let f = 0; f < frames.length; f++) {
        const row = frames[f]
        const painted = row.filter((s) => s.height > 1)
        if (painted.length < 2) continue
        const lowest = painted.reduce((a, b) => (a.top > b.top ? a : b))
        const highest = painted.reduce((a, b) => (a.top < b.top ? a : b))

        for (const s of row) {
          if (s.radius <= R) continue
          // A mirrored bar's radius is on its BOTTOM edge, an unmirrored one's
          // on its TOP. Either way that edge must be the outside of the stack.
          const outer = s.mirrored ? lowest : highest
          if (outer.name !== s.name) {
            violations.interior.push(
              `frame ${f}: ${s.name} has r=${s.radius.toFixed(1)} on an interior seam ` +
                `(the ${s.mirrored ? 'lowest' : 'highest'} painted layer is ${outer.name})`,
            )
          }
        }

        // The mirror must never be dropped while there is still a corner to
        // place, or the radius jumps to the opposite end of the bar.
        if (f > 0) {
          const prev = frames[f - 1]
          row.forEach((s, idx) => {
            const p = prev[idx]
            if (p && p.mirrored && !s.mirrored && s.radius > R) {
              violations.inverted.push(`frame ${f}: ${s.name} lost its mirror with r=${s.radius.toFixed(1)}`)
            }
          })
        }
      }
      return violations
    })
  }
}

const CASES = [
  [0, 'Phones'],
  [3, 'Wearables'],
]

test.describe('Stacked column, a rounded cap stays on the outer edge', () => {
  for (const [index, name] of CASES) {
    test(`hiding ${name} never rounds an interior seam or inverts a cap`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('column', 'stacked-column')
      await waitForStillChart(page)

      const settle = await watchCorners(page)
      await page.locator('.apexcharts-legend-series').nth(index).click()
      const v = await settle()

      expect(v.inverted, v.inverted.join('\n')).toEqual([])
      expect(v.interior, v.interior.join('\n')).toEqual([])
    })

    test(`showing ${name} again never rounds an interior seam or inverts a cap`, async ({
      page,
      loadChart,
    }) => {
      await loadChart('column', 'stacked-column')
      await waitForStillChart(page)

      await page.locator('.apexcharts-legend-series').nth(index).click()
      await waitForStillChart(page)

      const settle = await watchCorners(page)
      await page.locator('.apexcharts-legend-series').nth(index).click()
      const v = await settle()

      expect(v.inverted, v.inverted.join('\n')).toEqual([])
      expect(v.interior, v.interior.join('\n')).toEqual([])
    })
  }

  test('the departing layer keeps its cap all the way down', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    const settle = await watchCorners(page)
    await page.locator('.apexcharts-legend-series').nth(0).click()
    await settle()

    // It owns the outer edge until it vanishes, so it must stay rounded for as
    // long as it is tall enough to show a corner at all, never squared off
    // early to hand the cap over.
    const squaredEarly = await page.evaluate(() =>
      window.__frames
        .map((row, f) => ({ f, s: row[0] }))
        .filter(({ s }) => s && s.height > 12 && s.radius < 0.5)
        .map(({ f, s }) => `frame ${f}: height ${s.height.toFixed(1)} but r=${s.radius.toFixed(2)}`),
    )
    expect(squaredEarly, squaredEarly.join('\n')).toEqual([])
  })

  test('a collapsing layer keeps its data labels while its bars are still painted', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    await page.evaluate(() => {
      window.__labelFrames = []
      const tick = () => {
        const wrap = [...document.querySelectorAll('.apexcharts-datalabels')].find(
          (dl) => dl.getAttribute('data:realIndex') === '0',
        )
        const bar = document.querySelector(
          '.apexcharts-series[data\\:realIndex="0"] .apexcharts-bar-area',
        )
        window.__labelFrames.push({
          barHeight: bar ? bar.getBBox().height : 0,
          labels: wrap
            ? [...wrap.querySelectorAll('text')].filter((t) => t.textContent.trim()).length
            : 0,
        })
        window.__lblRaf = requestAnimationFrame(tick)
      }
      window.__lblRaf = requestAnimationFrame(tick)
    })

    await page.locator('.apexcharts-legend-series').nth(0).click()
    await page.waitForTimeout(2500)

    // While its bars still occupy real height, the slices must carry numbers, 
    // a big painted slice sitting there unlabelled is the desync.
    const unlabelled = await page.evaluate(() => {
      cancelAnimationFrame(window.__lblRaf)
      return window.__labelFrames
        .map((f, i) => ({ ...f, i }))
        .filter((f) => f.barHeight > 20 && f.labels === 0)
        .map((f) => `frame ${f.i}: bar height ${f.barHeight.toFixed(1)} but 0 labels`)
    })
    expect(unlabelled, unlabelled.join('\n')).toEqual([])
  })
})
