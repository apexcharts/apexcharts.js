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
 */

import { test, expect } from '../fixtures/base.js'

/** Poll until no bar has moved between two samples (see stacked-collapse-seams). */
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
 * Sample one element every frame through the next transition and report how
 * many distinct vertical positions (and label strings) it passed through.
 *
 * @param {string} selector first match is watched
 */
async function watch(page, selector) {
  await page.evaluate((selector) => {
    window.__seen = { pos: new Set(), text: new Set() }
    const tick = () => {
      const el = document.querySelector(selector)
      if (el) {
        window.__seen.pos.add(el.getBoundingClientRect().top.toFixed(1))
        window.__seen.text.add((el.textContent || '').trim())
      }
      window.__rafId = requestAnimationFrame(tick)
    }
    tick()
  }, selector)

  return async () => {
    await page.waitForTimeout(1500)
    return page.evaluate(() => {
      cancelAnimationFrame(window.__rafId)
      return {
        positions: window.__seen.pos.size,
        texts: window.__seen.text.size,
      }
    })
  }
}

/** A same-shape value update, the one that goes through fastUpdate. */
async function bumpValues(page) {
  await page.evaluate(() =>
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
  test('a bar data label rides to its new slot instead of snapping', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    const settle = await watch(page, '.apexcharts-datalabel')
    await bumpValues(page)
    const { positions } = await settle()

    expect(positions).toBeGreaterThanOrEqual(RIDE)
  })

  test('the stacked total rides on its own delta, not the segment it sits above', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    const settle = await watch(page, '.apexcharts-datalabel-total')
    await bumpValues(page)
    const { positions } = await settle()

    expect(positions).toBeGreaterThanOrEqual(RIDE)
  })

  test('counting the value up stays opt-in, the number itself does not tween', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    const settle = await watch(page, '.apexcharts-datalabel')
    await bumpValues(page)
    const { texts } = await settle()

    // Old string, then new string. A count-up would walk through dozens.
    expect(texts).toBeLessThanOrEqual(2)
  })

  test('dataLabels.countUp opts the number into tweening', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await page.evaluate(() =>
      window.chart.updateOptions({ dataLabels: { countUp: { enabled: true } } }),
    )
    await waitForStillChart(page)

    const settle = await watch(page, '.apexcharts-datalabel')
    await bumpValues(page)
    const { texts } = await settle()

    expect(texts).toBeGreaterThanOrEqual(RIDE)
  })

  test('the total keeps riding when the series that draws it changes', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    // The stacked total is drawn by the topmost ACTIVE series, so toggling the
    // LAST series changes the drawer. The total's identity key must survive
    // that handoff (it is keyed by group, not by drawer) or the ride silently
    // degrades to a snap for exactly this one series - hide and show alike.
    const LAST = 3

    let settle = await watch(page, '.apexcharts-datalabel-total')
    await page.locator('.apexcharts-legend-series').nth(LAST).click()
    const hide = await settle()
    expect(hide.positions).toBeGreaterThanOrEqual(RIDE)

    await waitForStillChart(page)
    settle = await watch(page, '.apexcharts-datalabel-total')
    await page.locator('.apexcharts-legend-series').nth(LAST).click()
    const show = await settle()
    expect(show.positions).toBeGreaterThanOrEqual(RIDE)
  })

  test('a label waits for ITS bar: the last category rides the stagger clock', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    // Bars keep a per-datapoint stagger on pure value updates (j * base). The
    // labels used to move on one immediate clock, so the FIRST category looked
    // perfect while the LAST one's label landed a full stagger-spread before
    // its bar started moving. Track each label against its own bar, per frame,
    // after paint (rAF alone samples pre-paint state).
    await page.evaluate(() => {
      window.__drift = { j0: 0, j5: 0 }
      window.__settled = null
      const read = () => {
        const out = {}
        for (const j of [0, 5]) {
          const bar = document.querySelector(
            `.apexcharts-series[data\\:realIndex="1"] .apexcharts-bar-area[j="${j}"]`,
          )
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
      window.__frames = []
      const tick = () => {
        const r = read()
        if (r) window.__frames.push(r)
        window.__syncRaf = requestAnimationFrame(() => setTimeout(tick, 0))
      }
      tick()
    })

    await bumpValues(page)
    await page.waitForTimeout(1800)

    const drift = await page.evaluate(() => {
      cancelAnimationFrame(window.__syncRaf)
      const frames = window.__frames
      const settled = frames[frames.length - 1]
      const worst = { j0: 0, j5: 0 }
      for (const f of frames) {
        worst.j0 = Math.max(worst.j0, Math.abs(f.j0 - settled.j0))
        worst.j5 = Math.max(worst.j5, Math.abs(f.j5 - settled.j5))
      }
      return worst
    })

    // Pre-fix the last category drifted ~57px from its bar mid-flight while
    // the first stayed under 1px. In sync, both stay within a few px (easing
    // rounding and the anchor offset wobble).
    expect(drift.j0).toBeLessThan(6)
    expect(drift.j5).toBeLessThan(6)
  })
})

test.describe('Axis chrome reflows on the fast update path too', () => {
  test('a y-axis tick label slides when a same-shape update moves the scale', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'stacked-column')
    await waitForStillChart(page)

    const settle = await watch(page, '.apexcharts-yaxis-label')
    await bumpValues(page)
    const { positions } = await settle()

    expect(positions).toBeGreaterThanOrEqual(RIDE)
  })
})
