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
 * snapshot: the settled states were always right. Every frame is stepped on
 * virtual time and read by the corners probe (helpers/frames.js).
 */

import { test, expect } from '@playwright/test'
import { loadSample, recordTransition, checkAll, expectNoViolations, probes } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

const R = 0.5 // below this there is no corner to see

const legend = (page, index) => () => page.locator('.apexcharts-legend-series').nth(index).click()

/** Interior-seam and inverted-cap violations across the recorded frames. */
function cornerViolations(rows) {
  const inverted = []
  const interior = []
  rows.forEach(({ row }, f) => {
    const painted = row.filter((s) => s.height > 1)
    if (painted.length < 2) return
    const lowest = painted.reduce((a, b) => (a.top > b.top ? a : b))
    const highest = painted.reduce((a, b) => (a.top < b.top ? a : b))

    for (const s of row) {
      if (s.radius <= R) continue
      // A mirrored bar's radius is on its BOTTOM edge, an unmirrored one's
      // on its TOP. Either way that edge must be the outside of the stack.
      const outer = s.mirrored ? lowest : highest
      if (outer.name !== s.name) {
        interior.push(
          `frame ${f}: ${s.name} has r=${s.radius.toFixed(1)} on an interior seam ` +
            `(the ${s.mirrored ? 'lowest' : 'highest'} painted layer is ${outer.name})`,
        )
      }
    }

    // The mirror must never be dropped while there is still a corner to
    // place, or the radius jumps to the opposite end of the bar.
    if (f > 0) {
      const prev = rows[f - 1].row
      row.forEach((s, idx) => {
        const p = prev[idx]
        if (p && p.mirrored && !s.mirrored && s.radius > R) {
          inverted.push(`frame ${f}: ${s.name} lost its mirror with r=${s.radius.toFixed(1)}`)
        }
      })
    }
  })
  return { inverted, interior }
}

const CASES = [
  [0, 'Phones'],
  [3, 'Wearables'],
]

test.describe('Stacked column, a rounded cap stays on the outer edge', () => {
  for (const [index, name] of CASES) {
    test(`hiding ${name} never rounds an interior seam or inverts a cap`, async ({ page }) => {
      const errors = await loadSample(page, 'column', 'stacked-column')
      const rec = await recordTransition(page, legend(page, index), { probe: probes.corners })
      const v = cornerViolations(rec.probes)

      expect(v.inverted, v.inverted.join('\n')).toEqual([])
      expect(v.interior, v.interior.join('\n')).toEqual([])
      expectNoViolations(checkAll(rec), `hide ${name}`)
      expect(errors).toEqual([])
    })

    test(`showing ${name} again never rounds an interior seam or inverts a cap`, async ({ page }) => {
      const errors = await loadSample(page, 'column', 'stacked-column')
      await legend(page, index)()
      await advance(page, 4000)
      const rec = await recordTransition(page, legend(page, index), { probe: probes.corners })
      const v = cornerViolations(rec.probes)

      expect(v.inverted, v.inverted.join('\n')).toEqual([])
      expect(v.interior, v.interior.join('\n')).toEqual([])
      expectNoViolations(checkAll(rec), `show ${name}`)
      expect(errors).toEqual([])
    })
  }

  test('the departing layer keeps its cap all the way down', async ({ page }) => {
    await loadSample(page, 'column', 'stacked-column')
    const rec = await recordTransition(page, legend(page, 0), { probe: probes.corners })

    // It owns the outer edge until it vanishes, so it must stay rounded for as
    // long as it is tall enough to show a corner at all, never squared off
    // early to hand the cap over.
    const squaredEarly = rec.probes
      .map(({ row }, f) => ({ f, s: row[0] }))
      .filter(({ s }) => s && s.height > 12 && s.radius < R)
      .map(({ f, s }) => `frame ${f}: height ${s.height.toFixed(1)} but r=${s.radius.toFixed(2)}`)
    expect(squaredEarly, squaredEarly.join('\n')).toEqual([])
  })

  test('a collapsing layer keeps its data labels while its bars are still painted', async ({ page }) => {
    await loadSample(page, 'column', 'stacked-column')
    const rec = await recordTransition(page, legend(page, 0), { probe: probes.corners })

    // While its bars still occupy real height, the slices must carry numbers:
    // a big painted slice sitting there unlabelled is the desync.
    const unlabelled = rec.probes
      .map(({ row, labels }, f) => ({ f, s: row.find((r) => r.realIndex === '0'), n: labels['0'] || 0 }))
      .filter(({ s, n }) => s && s.height > 20 && n === 0)
      .map(({ f, s }) => `frame ${f}: bar height ${s.height.toFixed(1)} but 0 labels`)
    expect(unlabelled, unlabelled.join('\n')).toEqual([])
  })
})
