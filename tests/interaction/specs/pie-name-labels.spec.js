/**
 * Pie / donut — outer name labels + connector lines.
 *
 * Covers (in real Chromium, so geometry/measurement is exercised for real):
 *   - one name label + one connector line per slice
 *   - labels + connectors reveal gradually after the sweep (delayedElements),
 *     not instantly
 *   - name labels render OUTSIDE the pie body (beyond the slice radius)
 *   - the de-overlap pass keeps labels from overlapping
 *   - donut renders the feature without JS errors
 *   - polarArea does NOT render outer name labels (radial length = value)
 *
 * Samples (generated from samples/source/*.xml):
 *   pie/simple-pie, pie/simple-donut (both use external.show + no legend)
 *   data: [44, 55, 13, 43, 22] — labels Team A..Team E
 */

import { test, expect } from '../fixtures/base.js'

const SLICE_COUNT = 5

test.describe('Pie outer name labels', () => {
  test('renders one name label + connector per slice', async ({
    page,
    loadChart,
  }) => {
    await loadChart('pie', 'simple-pie')

    const names = await page.$$eval('.apexcharts-pie-name-label', (els) =>
      els.map((e) => e.textContent),
    )
    expect(names).toHaveLength(SLICE_COUNT)
    expect(names).toContain('Organic Search')
    expect(names).toContain('Email')

    const connectors = await page.$$('.apexcharts-pie-label-connector')
    expect(connectors).toHaveLength(SLICE_COUNT)
  })

  test('reveals labels + connectors gradually (delayedElements), not instantly', async ({
    page,
  }) => {
    // Mid-sweep: each label group is hidden via apexcharts-element-hidden.
    await page.goto(
      `file://${process.cwd()}/samples/vanilla-js/pie/simple-pie.html`,
    )
    await page.waitForSelector('.apexcharts-pie-name-label-group')
    const during = await page.evaluate(() => ({
      ended: window.chart.w.globals.animationEnded,
      hidden: document.querySelectorAll(
        '.apexcharts-pie-name-label-group.apexcharts-element-hidden',
      ).length,
      total: document.querySelectorAll('.apexcharts-pie-name-label-group')
        .length,
    }))
    expect(during.ended).toBe(false)
    expect(during.hidden).toBe(during.total)

    // After the sweep completes, showDelayedElements reveals them (fade in).
    await page.waitForFunction(
      () => window.chart.w.globals.animationEnded === true,
    )
    const shown = await page.$$(
      '.apexcharts-pie-name-label-group.apexcharts-hidden-element-shown',
    )
    const stillHidden = await page.$$(
      '.apexcharts-pie-name-label-group.apexcharts-element-hidden',
    )
    expect(shown).toHaveLength(SLICE_COUNT)
    expect(stillHidden).toHaveLength(0)
  })

  test('name labels sit outside the pie body', async ({ page, loadChart }) => {
    await loadChart('pie', 'simple-pie')

    // Pie bounding box gives us a reliable center + radius in screen space.
    const geom = await page.evaluate(() => {
      const pie = document.querySelector('.apexcharts-pie')
      const slices = document.querySelector('.apexcharts-slices')
      const pr = pie.getBoundingClientRect()
      // radius from the slices group (excludes outer labels)
      const sr = slices.getBoundingClientRect()
      const cx = sr.left + sr.width / 2
      const cy = sr.top + sr.height / 2
      const radius = Math.min(sr.width, sr.height) / 2
      const labels = Array.from(
        document.querySelectorAll('.apexcharts-pie-name-label'),
      ).map((el) => {
        const r = el.getBoundingClientRect()
        return {
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
        }
      })
      return { cx, cy, radius, labels, pieWidth: pr.width }
    })

    // Every name label's center must be farther from the pie center than ~90%
    // of the slice radius — i.e. genuinely outside the slices.
    for (const l of geom.labels) {
      const dist = Math.hypot(l.cx - geom.cx, l.cy - geom.cy)
      expect(dist).toBeGreaterThan(geom.radius * 0.9)
    }
  })

  test('de-overlap keeps labels from overlapping each other', async ({
    page,
    loadChart,
  }) => {
    await loadChart('pie', 'simple-pie')

    const rects = await page.$$eval('.apexcharts-pie-name-label', (els) =>
      els.map((e) => {
        const r = e.getBoundingClientRect()
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }
      }),
    )
    // No two labels' bounding boxes may intersect. (The de-overlap pass spaces
    // same-side labels vertically; opposite-side labels are separated in x.)
    const overlaps = (a, b) =>
      a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        expect(
          overlaps(rects[i], rects[j]),
          `labels ${i} and ${j} overlap`,
        ).toBe(false)
      }
    }
  })

  test('donut renders name labels without errors', async ({
    page,
    loadChart,
  }) => {
    await loadChart('pie', 'simple-donut')
    const names = await page.$$('.apexcharts-pie-name-label')
    expect(names).toHaveLength(SLICE_COUNT)
  })

  test('polarArea ignores external.show (no outer labels)', async ({
    page,
    loadChart,
  }) => {
    await loadChart('polarArea', 'basic-polar-area')
    // Turn the feature on at runtime — polarArea must still not draw them.
    await page.evaluate(async () => {
      await window.chart.updateOptions({
        plotOptions: { pie: { dataLabels: { external: { show: true } } } },
      })
    })
    const names = await page.$$('.apexcharts-pie-name-label')
    expect(names).toHaveLength(0)
  })
})
