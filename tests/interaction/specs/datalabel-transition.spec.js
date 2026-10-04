/**
 * Data labels and axis ticks reflow on the same clock as the marks.
 *
 * Everything else in an update already moves continuously: the bar morph, the
 * markers, the axis chrome. A data label that snaps to its final slot on the
 * first frame lands several hundred ms before the bar it belongs to, which is
 * what these tests exist to catch. They watch one element's on-screen position
 * every animation frame and count how many distinct places it occupied: a snap
 * visits two (before, after), a ride visits many.
 *
 * The other half of this is WHERE the tweens are applied. A same-shape
 * updateSeries (far and away the most common update) is served by
 * `fastUpdate`, not `update()`, and for a long time neither transition was
 * wired into it. Every test here drives exactly that path.
 *
 * Recorded frame by frame on the virtual clock (helpers/frames.js), so every
 * frame is seen however loaded the machine is.
 */

import { test, expect } from '@playwright/test'
import { loadSample, recordTransition } from '../helpers/frames.js'
import { advance } from '../helpers/virtual-time.js'

/** Where the first element matching `selector` is, and what it says. */
function watched(selector) {
  const el = document.querySelector(selector)
  return el ? { top: el.getBoundingClientRect().top.toFixed(1), text: (el.textContent || '').trim() } : null
}

/**
 * Run `action` and count the distinct positions and strings the first match
 * of `selector` passed through, the frame before the action included.
 */
async function watch(page, selector, action) {
  const rec = await recordTransition(page, action, { ms: 1500, probe: watched, probeArg: selector })
  const seen = [rec.probeBefore, ...rec.probes].filter(Boolean)
  return {
    positions: new Set(seen.map((s) => s.top)).size,
    texts: new Set(seen.map((s) => s.text)).size,
  }
}

/** A same-shape value update, the one that goes through fastUpdate. */
function bumpValues(page) {
  return () =>
    page.evaluate(() =>
      window.chart.updateSeries(
        window.chart.w.config.series.map((s, i) => ({
          name: s.name,
          data: s.data.map((v) => Math.max(3, Math.round(v * (i === 0 ? 0.5 : 1.7)))),
        })),
      ),
    )
}

// A ride passes through many positions; a snap has exactly two (the value
// before the update and the value after). 5 is comfortably clear of both the
// snap case and any single stray frame.
const RIDE = 5

test.describe('Data labels reflow with the marks (bar/column, on by default)', () => {
  test('a bar data label rides to its new slot instead of snapping', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    const { positions } = await watch(page, '.apexcharts-datalabel', bumpValues(page))
    expect(positions).toBeGreaterThanOrEqual(RIDE)
    expect(errors).toEqual([])
  })

  test('the labels stay visible while they ride an updateSeries() (#5332)', async ({ page }) => {
    // Not stacked: BarStacked never hid its labels, Bar did.
    const errors = await loadSample(page, 'column', 'column-with-data-labels')

    // Position alone cannot catch this: the label group was born
    // `apexcharts-element-hidden` and still moved, at opacity 0, through the
    // whole morph. Sample what a viewer sees instead.
    const hiddenGroup = () => {
      const groups = [...document.querySelectorAll('.apexcharts-datalabels')]
      if (!groups.length) return null
      return groups.some((g) => getComputedStyle(g).opacity === '0')
    }
    const rec = await recordTransition(page, bumpValues(page), { ms: 1500, probe: hiddenGroup })
    const frames = rec.probes.filter((p) => p !== null)

    expect(frames.length).toBeGreaterThan(20)
    expect(frames.filter(Boolean).length).toBe(0)
    expect(errors).toEqual([])
  })

  test('the stacked total rides on its own delta, not the segment it sits above', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    const { positions } = await watch(page, '.apexcharts-datalabel-total', bumpValues(page))
    expect(positions).toBeGreaterThanOrEqual(RIDE)
    expect(errors).toEqual([])
  })

  test('counting the value up stays opt-in, the number itself does not tween', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    const { texts } = await watch(page, '.apexcharts-datalabel', bumpValues(page))
    // Old string, then new string. A count-up would walk through dozens.
    expect(texts).toBeLessThanOrEqual(2)
    expect(errors).toEqual([])
  })

  test('dataLabels.countUp opts the number into tweening', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    await page.evaluate(() => window.chart.updateOptions({ dataLabels: { countUp: { enabled: true } } }))
    await advance(page, 2000)
    const { texts } = await watch(page, '.apexcharts-datalabel', bumpValues(page))
    expect(texts).toBeGreaterThanOrEqual(RIDE)
    expect(errors).toEqual([])
  })

  test('the total keeps riding when the series that draws it changes', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')

    // The stacked total is drawn by the topmost ACTIVE series, so toggling the
    // LAST series changes the drawer. The total's identity key must survive
    // that handoff (it is keyed by group, not by drawer) or the ride silently
    // degrades to a snap for exactly this one series - hide and show alike.
    const LAST = 3
    const toggle = () => page.locator('.apexcharts-legend-series').nth(LAST).click()

    const hide = await watch(page, '.apexcharts-datalabel-total', toggle)
    expect(hide.positions).toBeGreaterThanOrEqual(RIDE)

    await advance(page, 2000)
    const show = await watch(page, '.apexcharts-datalabel-total', toggle)
    expect(show.positions).toBeGreaterThanOrEqual(RIDE)
    expect(errors).toEqual([])
  })

  test('a label waits for ITS bar: the last category rides the stagger clock', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')

    // Bars keep a per-datapoint stagger on pure value updates (j * base). The
    // labels used to move on one immediate clock, so the FIRST category looked
    // perfect while the LAST one's label landed a full stagger-spread before
    // its bar started moving. Track each label against its own bar, per frame.
    const offsets = () => {
      const out = {}
      for (const j of [0, 5]) {
        const bar = document.querySelector(`.apexcharts-series[data\\:realIndex="1"] .apexcharts-bar-area[j="${j}"]`)
        const lbl = document.querySelector(
          `.apexcharts-datalabels[data\\:realIndex="1"] .apexcharts-data-labels[data\\:dlJ="${j}"] text`,
        )
        if (!bar || !lbl) return null
        const b = bar.getBoundingClientRect()
        const l = lbl.getBoundingClientRect()
        out[`j${j}`] = l.y + l.height / 2 - (b.y + b.height / 2)
      }
      return out
    }
    const rec = await recordTransition(page, bumpValues(page), { ms: 1800, probe: offsets })
    const frames = rec.probes.filter(Boolean)
    const settled = frames[frames.length - 1]
    const worst = { j0: 0, j5: 0 }
    for (const f of frames) {
      worst.j0 = Math.max(worst.j0, Math.abs(f.j0 - settled.j0))
      worst.j5 = Math.max(worst.j5, Math.abs(f.j5 - settled.j5))
    }

    // Pre-fix the last category drifted ~57px from its bar mid-flight while
    // the first stayed under 1px. In sync, both stay within a few px (easing
    // rounding and the anchor offset wobble). Frame 0 counts: on the virtual
    // clock it showed the first category's label 56px off its bar until the
    // ride's first frame, which an update made inside a rAF callback paints.
    expect(worst.j0).toBeLessThan(6)
    expect(worst.j5).toBeLessThan(6)
    expect(errors).toEqual([])
  })
})

test.describe('Axis chrome reflows on the fast update path too', () => {
  test('a y-axis tick label slides when a same-shape update moves the scale', async ({ page }) => {
    const errors = await loadSample(page, 'column', 'stacked-column')
    const { positions } = await watch(page, '.apexcharts-yaxis-label', bumpValues(page))
    expect(positions).toBeGreaterThanOrEqual(RIDE)
    expect(errors).toEqual([])
  })
})
